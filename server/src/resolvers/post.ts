import {
  Arg,
  Mutation,
  Query,
  Resolver,
  Ctx,
  Field,
  InputType,
  UseMiddleware,
  Int,
  Root,
  FieldResolver,
  ObjectType,
} from "type-graphql";
import { MyContext } from "src/types";
import Post from "../entities/PostEnt";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import Updoot from "../entities/Updoot";
//rerun
@InputType()
class PostInput {
  @Field()
  title: string;

  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[]; //array of Post
  @Field()
  hasMore: boolean;
}

//GRAPHQL QUERY
@Resolver(Post) //we need to add Post if we are going to add FieldResolver, we are resolving Post
export class PostResolver {
  // this is not a db or anything this will just do something and send to client
  //@FieldResolver is from graphql
  //This will be called everytime we get a Post Object
  //ONLY GRAPHQL THAT WE CAN GET
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50) + "...";
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth) //if loggedin only
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpdoot = value === -1;
    const realValue = isUpdoot ? -1 : 1;
    const { userId } = req.session; //lets pass it here to put in updoot
    // await Updoot.insert({
    //   userId,
    //   postId,
    //   value: realValue,
    // });
    //UPDATING A UPDOOT and POST if one of them fails they both fails
    //VOTING
    const updoot = await Updoot.findOne({ where: { postId, userId } }); //lets check if they have an entry from the database// and we can also access the updoot.value that they putted
    if (updoot && updoot.value !== realValue) {
      //means if the updoot value is one then they are trying to updoot it again then NO they cannot
      //this means the use has been voted on the post before
      //so they are just need to change they're vote
      await getConnection().transaction(async (tm) => {
        //instead of inserting we just need to update our updoot table
        await tm.query(
          `
        update updoot
        set value = $1
        where "postId" = $2 and "userId" = $3        
        `,
          [realValue, postId, userId]
        ); //Also make sure to pass the userId and postId to find it
        // now for post
        await tm.query(
          // if our voute value is 1 //post point 1 //if we just add -1 //it is going to become zero but we want to be -1
          `
     update post 
    set points = points + $1
    where id = $2;     
        `,
          [2 * realValue, postId]
        );
      });
    } else if (!updoot) {
      //has never been voted before
      //tm so we can query stuff
      await getConnection().transaction(async (tm) => {
        await tm.query(
          //if inser we need to add 'values'
          ` insert into updoot ("userId", "postId", value) values ($1, $2, $3)`,
          [userId, postId, realValue]
        );
        await tm.query(
          `
        
    update post 
    set points = points + $1
    where id = $2;
        `,
          [realValue, postId] //bc if it is 1 and we do -1 we should do x2 and if -1 we need to add 1 x2
        );
      });
    }

    //############################### same as above
    // await getConnection().query(
    //   `
    // START TRANSACTION;

    // insert into updoot ("userId", "postId", value) values (${userId}, ${postId}, ${realValue});

    // update post
    // set points = points + ${realValue}
    // where id = ${postId};

    // COMMIT;
    // `
    // ); //[$,1 $2, $3, $4, $5] //we cannot do it if there are 2 so we need to just stick there

    return true;
  }

  //Query is for getting datas
  //Get all posts
  @Query(() => PaginatedPosts)
  async posts(
    //PAGINATION
    //()=>Int graphql will see it so we also need to ad Int in our mutation
    @Arg("limit", () => Int) limit: number, //LIMIT

    //if we want to make it nullable we should do () => Int
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null, //IT WILL GIVE US BASE ON THE lists numbers
    @Ctx() { req }: MyContext
  ): Promise<PaginatedPosts> {
    //WE WILL USE SELECT USER query
    // we need to add '' in createdAt
    const realLimit = Math.min(50, limit); //we cap it at 50
    const realLimitPlusOne = realLimit + 1; //we added + 1 for pagination algo
    const replacements: any[] = [realLimitPlusOne];

    //if there is a user
    if (req.session.userId) {
      replacements.push(req.session.userId);
    }
    let cursorIdx = 3;
    //if there is a cursor
    if (cursor) {
      replacements.push(new Date(parseInt(cursor))); //should be number date
      cursorIdx = replacements.length;
    }
    //select post all from post p is alias for post
    //we add public bc it confuses the query bc there are multiple user
    // json_build_object('username': u.username) creator OBJECT BUILDER
    //  inner join public.user u on u.id = p."creatorId" #we are getting only the u.id with the same id in p.creatorId

    //ERROR that I encountered  error: bind message supplies 2 parameters, but prepared statement "" requires 1
    //we need to line up the $1 and so on
    const posts = await getConnection().query(
      `
    select p.*, 
    json_build_object(
      'id', u.id,
      'username', u.username,
      'email', u.email,
      'createdAt', u."createdAt"
      ) creator,
    ${
      req.session.userId
        ? '(select value from updoot where "userId" = $2 and "postId" = p.id) "voteStatus"'
        : 'null as "voteStatus"'
    }

    from post p

    inner join public.user u on u.id = p."creatorId"

    ${cursor ? `where p."createdAt" < $${cursorIdx}` : ""} 

    order by p."createdAt" DESC

    limit $1
    `,
      replacements
    );
    // const qb = getConnection()
    //   .getRepository(Post)
    //   .createQueryBuilder("p")
    //   .orderBy('"createdAt"', "DESC") //we can also do descending .orderBy('"createdAt"', "ASC") // we should add 2nd parameter!
    //   .take(realLimitPlusOne); //take should use in pagination
    // if (cursor) {
    //   qb.where('"createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) }); // .where("user.id = :id", { id }) //we are getting the items higher than last cursor 'date'
    // }
    console.log(posts);
    // const posts = await qb.getMany();
    return {
      hasMore: posts.length === realLimitPlusOne, //we are just checking if we have more post
      posts: posts.slice(0, realLimit), //we are going to slice it so can get the 20 bc it has the realLimitPlusOne in qb
    }; //this will ad in the last
  }
  //Get Post
  @Query(() => Post, { nullable: true })
  post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id, { relations: ["creator"] });
  }

  //Mutation creating
  //Create a post
  @Mutation(() => Post)
  @UseMiddleware(isAuth) //this will run before below
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post | String> {
    //2 sql queries

    return Post.create({ ...input, creatorId: req.session.userId }).save(); //creating a post and saving it
  }

  //Mutation creating
  //Update a post
  @Mutation(() => Post, { nullable: true }) //if we want to to be nullabe
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String) title: string, //if we want to to be nullabe () => String, { nullable: true }
    @Arg("text", () => String) text: string, //if we want to to be nullabe () => String, { nullable: true }
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    //SHOULD BE THE SAME USER req.session.userId
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();
    console.log(result.raw[0]);
    return result.raw[0];
  }

  //Delete a post
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    //Always put Int if it is a number
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    //NOT CASCADE WAY
    // const post = await Post.findOne(id);
    // if (!post) {
    //   return false;
    // }
    // if (post.creatorId !== req.session.userId) {
    //   throw new Error("not authorize");
    // }
    // //they should only can delete if they are the same user in the post
    // //First we should delete everything that has related to the post
    // await Updoot.delete({ postId: id });
    // await Post.delete({ id, creatorId: req.session.userId });

    await Post.delete({ id, creatorId: req.session.userId });

    return true;
  }
}
