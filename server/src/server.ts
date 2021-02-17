import "reflect-metadata"; //typeorm need this

import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { UserResolver } from "./resolvers/user";
import { PostResolver } from "./resolvers/post";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import __prod__ from "./constants";
import { MyContext } from "./types";
import cors from "cors";
import { createConnection } from "typeorm";
import Post from "./entities/PostEnt";
import User from "./entities/User";
import path from "path";
import Updoot from "./entities/Updoot";

declare module "express-session" {
  interface Session {
    userId: number;
  }
}
const main = async () => {
  const connection = await createConnection({
    type: "postgres",
    database: "rit2",
    username: "postgres",
    password: "xxkaa548",
    logging: true,
    synchronize: true,
    entities: [Post, User, Updoot],
    migrations: [path.join(__dirname, "./migrations/*")],
  });
  //rerun
  // await Post.delete({});
  //run

  //creating migration npx typeorm migration:create -n MockPosts !MANUAL
  // to run migrations
  await connection.runMigrations();
  console.log("watchs");

  // //Connect to db first
  // const orm = await MikroORM.init(microConfig);

  // //to run migration before
  // await orm.getMigrator().up();
  // console.log("aw");
  const app = express();

  //2 cookie
  const RedisStore = connectRedis(session);
  const redis = new Redis();
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  console.log("rune");
  app.use(
    session({
      name: "qid", //cookie name
      store: new RedisStore({
        client: redis,
        disableTouch: true, //true to keep the user for too long
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years,
        httpOnly: true, //in your js code and frontend you cannot access the cookie
        secure: !__prod__, //cookie only works in https
        sameSite: "lax", //csrf
      },
      saveUninitialized: false, //it will create a session by default turn it to false so we can add
      secret: "asfasfasfasfasfacWTGSD",
      resave: false,
    })
  );
  //for building schema and running controllers or resolvers
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    //to access an object
    context: ({ req, res }): MyContext => ({ req, res, redis }),
  });
  console.log("run");
  //to create a graphql endpoint for us on express
  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(5000, () => {
    console.log("server is connected in 5000");
  });
};
main().catch((e) => {
  console.log(e);
});
console.log("done");
