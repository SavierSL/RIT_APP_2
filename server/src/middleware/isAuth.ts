import { MyContext } from "src/types";
import { MiddlewareFn } from "type-graphql";

//IS AUTH MIDDLEWARE
//CONTEXT IS FROM @CTX
export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
  if (!context.req.session.userId) {
    throw Error("Not Logged In");
  }
  return next();
};
