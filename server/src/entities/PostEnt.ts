import { ObjectType, Field, Int } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import Updoot from "./Updoot";
import User from "./User";

@ObjectType()
@Entity()
class Post extends BaseEntity {
  //Field() is from type graphql
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  title!: string;

  @Field()
  @Column()
  text!: string;

  @Field()
  @Column({ type: "int", default: 0 })
  points!: number;

  //OWNER FIELD
  @Field()
  @Column()
  creatorId!: number;

  @Field(() => Int, { nullable: true })
  voteStatus: number | null; // 1 or -1 or null

  //OWNER FIELD
  @Field(() => User) //we add field so we can get more data from creator bc User in creator is an objectType
  @ManyToOne(() => User, (user) => user.posts)
  creator: User;

  //Updoots
  @OneToMany(() => Updoot, (updoot) => updoot.post)
  updoots: Updoot[];

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}

export default Post;
