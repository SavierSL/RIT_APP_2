import User from "../entities/User";
import { MyContext } from "src/types";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import bcrypt from "bcrypt";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";
import { getConnection } from "typeorm";
@InputType() //Input types we use for arguments
export class UsernamePasswordInput {
  @Field()
  email: string;
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType() //Object types we use to return for our mutation
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

//GRAPHQL QUERY
@Resolver(User) //Add User bc we are using @FieldResolver
export class UserResolver {
  //To hide email
  //FIELD it is solving the User Field
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    //this is the current user so its ok to show them their own email
    if (req.session.userId === user.id) return user.email;
    //Current user wants to see someone elses email
    return "";
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email } }); //we should do where if not primary key
    if (!user) {
      //the email is not in the db
      return false;
    }
    const token = v4();
    await redis.set(
      token, //we are going to look up the value
      user.id, //to get the userID
      "ex",
      1000 * 60 * 60 * 24 * 3
    ); //3 days

    //in link let's pass a token
    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset</a>`
    );
    return true;
  }
  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }
    return User.findOne(req.session.userId);
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput, //Arguments
    @Ctx() { req }: MyContext // to use the em from server.ts use @Ctx
  ): Promise<UserResponse> {
    const response = validateRegister(options);
    if (response) {
      return response;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(options.password, salt);
    let user;
    try {
      //to create a new User
      //SQL BUILDER
      // but we can also do this User.create({}).save() same as below
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          email: options.email,
          username: options.username,
          password: hashedPass,
        })
        .returning("*")
        .execute(); //it is returning *
      user = result.raw[0]; //datas
    } catch (error) {
      if (error.code === "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "username already taken",
            },
          ],
        };
      }
    }
    // store user id sessin
    //will set a cookie on the user and keep them logged in
    req.session.userId = user.id;
    return { user };
  }
  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string, //Arguments
    @Arg("password") password: string,
    @Ctx() { req }: MyContext // to use the em from server.ts use @Ctx
  ): Promise<UserResponse> {
    const findUser = usernameOrEmail.includes("@")
      ? { where: { email: usernameOrEmail } }
      : { where: { username: usernameOrEmail } };
    console.log(findUser);
    const user = await User.findOne(findUser);
    console.log(user);
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "does not exist",
          },
        ],
      };
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "Incorrect password",
          },
        ],
      };
    }

    req.session.userId = user.id;
    return {
      user,
    };
  }
  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    //if there is an error in req.session.destroy() it will return false
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie("qid");
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }
}
