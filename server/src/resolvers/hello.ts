import { Query, Resolver } from "type-graphql";

//GRAPHQL QUERY
@Resolver()
export class HelloResolver {
  @Query(() => String)
  hello() {
    return "hello world";
  }
}
