import { ObjectType, Field } from "type-graphql";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import Post from "./PostEnt";
import User from "./User";

//m to m relationship
//user <-> posts //so everyone can post
// user -> join table <- posts
// user -> updoot <-posts

//we are going to connect it to user and also posts

@ObjectType()
@Entity()
class Updoot extends BaseEntity {
  @Field()
  @Column({ type: "int" })
  value: number;
  //Field() is from type graphql
  //OWNER FIELD
  @Field()
  @PrimaryColumn()
  userId!: number; //foreign key

  @Field(() => User) //we add field so we can get more data from creator bc User in creator is an objectType
  @ManyToOne(() => User, (user) => user.updoots) //we will need to add updoots in user
  user: User;

  @Field()
  @PrimaryColumn()
  postId: number; //foreign key

  //OWNER FIELD
  @Field(() => Post) //we add field so we can get more data from creator bc User in creator is an objectType
  @ManyToOne(() => Post, (post) => post.updoots, {
    onDelete: "CASCADE",
  })
  post: Post;
}

export default Updoot;
