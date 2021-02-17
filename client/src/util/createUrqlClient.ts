import {
  cacheExchange,
  Cache,
  QueryInput,
  Resolver,
} from "@urql/exchange-graphcache";
import {
  MeDocument,
  LoginMutation,
  LogoutMutation,
  MeQuery,
  RegisterMutation,
  PostsQuery,
  VoteMutation,
  PostsDocument,
  Post,
  VoteMutationVariables,
  DeletePostMutationVariables,
} from "../generated/graphql";
import { dedupExchange, fetchExchange, stringifyVariables } from "urql";
import { pipe, tap } from "wonka";
import { Exchange } from "urql";
import Router from "next/router";
import { gql } from "@urql/core";
import { isServer } from "./isServer";

//TO HANDLE THE ERRORS "GLOBALLY"
export const errorExchange: Exchange = ({ forward }) => (ops$) => {
  return pipe(
    forward(ops$),
    tap(({ error }) => {
      // If the OperationResult has an error send a request to sentry
      if (error?.message.includes("Not Logged In")) {
        //We use this Router.replace for all router to replace it is like Redirect
        Router.replace("/login");
        console.log(error);
      }
    })
  );
};
//2 arguments in function callback ########################################## 7:18
function betterUpdateQuery<Result, Query>(
  cache: Cache,
  qi: QueryInput,
  result: any,
  fn: (r: Result, q: Query) => Query
) {
  //fn (this will check what data to pick and it will return it to update)
  // data = MeQuery
  return cache.updateQuery(qi, (data) => fn(result, data as any) as any);
}

//CURSOR PAGINATION #########################################################
//https://github.com/FormidableLabs/urql/blob/main/exchanges/graphcache/src/extras/simplePagination.ts
//ALL RESOLVERS WILL PASS HERE and WILL DO SOMETHING ON CACHE
export const cursorPagination = (): Resolver => {
  //this is the shape of the client resolvers look
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;
    // entityKey = Query, fieldName = posts
    // console.log(entityKey, fieldName);################################
    // console.log(info);

    const allFields = cache.inspectFields(entityKey);
    //cache.inspectFields(entityKey); it will get all the fields in the cache that are under on this query, basically all the query in our cache
    // [
    //   {
    //     fieldKey: 'posts({"cursor":"","limit":10})',
    //     fieldName: "posts",
    //     arguments: { cursor: "", limit: 10 },
    //   },
    // ];
    // console.log(allFields); #####################################

    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    // console.log(fieldKey); //posts({"cursor":"","limit":10})
    const isItInTheCache = cache.resolve(
      //we did this bc the cache has a hasMore and we need the key not the /Query.posts({"cursor":"","limit":10})
      cache.resolve(entityKey, fieldKey) as string,
      "posts"
    );
    // console.log("isItInTheCache", isItInTheCache);
    //we need to tell urql when to do a query
    //IF IT IS NOT IN THE CACHE THEN WE WILL NOT DO PARTIAL RETURN
    info.partial = !isItInTheCache; //we need to see if it is in the cache or not

    //we are going to return undefiend if there is no data in fieldInfos
    //IT IS COMBINING THE DATA FROM PREVIOUS DATA + NEW DATA
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }
    //we need to loop in compile it into a list
    const results: string[] = [];
    let hasMore = true;
    //probably we are going to have a lot of fieldinfos bc it is an array
    fieldInfos.forEach((fi) => {
      const key = cache.resolve(entityKey, fi.fieldKey) as string;
      // console.log(key); //Query.posts({"cursor":"","limit":10})
      //we are going to pass the fi.fieldKey
      // so we are saying from the query get post on fieldkey
      const data = cache.resolve(key, "posts") as string[]; //we need to pass the key here bc the key has //Query.posts({"cursor":"","limit":10})
      const _hasMore = cache.resolve(key, "hasMore");
      if (!_hasMore) {
        //if hasMore is false
        hasMore = _hasMore as boolean;
      }
      // console.log(_hasMore); //true
      // console.log(data); // same as below
      ////FIRST OUTPUT
      // console.log(data);
      //so we are getting the id's array of strings
      // [
      //   "Post:23",
      //   "Post:24",
      //   "Post:20",
      //   "Post:22",
      //   "Post:21",
      //   "Post:16",
      //   "Post:17",
      //   "Post:18",
      //   "Post:19",
      //   "Post:25",
      // ];
      //same as above
      results.push(...data);
    });

    //we are just reading the data from the query and then we return nothing so special bruh!
    // console.log(results);
    return {
      //ERROR `Query.posts({"cursor":"","limit":10})` is a scalar (number, boolean, etc), but the GraphQL query expects a selection set for this field.
      __typename: "PaginatedPosts", //we can fix the error above by adding typename
      hasMore, // false
      posts: results,
    };

    // const visited = new Set();
    // let result: NullArray<string> = [];
    // let prevOffset: number | null = null;

    // for (let i = 0; i < size; i++) {
    //   const { fieldKey, arguments: args } = fieldInfos[i];
    //   if (args === null || !compareArgs(fieldArgs, args)) {
    //     continue;
    //   }

    //   const links = cache.resolve(entityKey, fieldKey) as string[];
    //   const currentOffset = args[offsetArgument];

    //   if (
    //     links === null ||
    //     links.length === 0 ||
    //     typeof currentOffset !== "number"
    //   ) {
    //     continue;
    //   }

    //   const tempResult: NullArray<string> = [];

    //   for (let j = 0; j < links.length; j++) {
    //     const link = links[j];
    //     if (visited.has(link)) continue;
    //     tempResult.push(link);
    //     visited.add(link);
    //   }

    //   if (
    //     (!prevOffset || currentOffset > prevOffset) ===
    //     (mergeMode === "after")
    //   ) {
    //     result = [...result, ...tempResult];
    //   } else {
    //     result = [...tempResult, ...result];
    //   }

    //   prevOffset = currentOffset;
    // }

    // const hasCurrentPage = cache.resolve(entityKey, fieldName, fieldArgs);
    // if (hasCurrentPage) {
    //   return result;
    // } else if (!(info as any).store.schema) {
    //   return undefined;
    // } else {
    //   info.partial = true;
    //   return result;
    // }
  };
};

//INVALIDATE ALL POST
function invalidateAllPost(cache: Cache) {
  //This one is also invalidating a queries
  //INVALIDATING
  const allFields = cache.inspectFields("Query");
  const fieldInfos = allFields.filter((info) => info.fieldName === "posts");
  fieldInfos.forEach((fi) => {
    //INVALIDATING ALL THE Queries
    //Ivalidating so we can stick the post at the top 8:55
    //Query we want to invalidate
    //specifically posts
    //3rd is arguments
    cache.invalidate(
      "Query",
      "posts",
      fi.arguments || { limit: 15, cursor: "" }
      //should be same in our front end super SAME!
      // cursor: "",
      // limit: 15,
    );
  });
}

//to connect in graphql
//CTX we added this to fix the ssr functionality bc the cookie is not sending into graphql 10:01
export const createUrqlClient = (ssrExchange: any, ctx: any) => {
  let cookie = "";
  //nextjs server
  //it is going to send the cookie to nextjs server
  //and it will send
  if (isServer()) {
    cookie = ctx?.req?.headers?.cookie;
  }
  return {
    url: "http://localhost:5000/graphql",
    fetchOptions: {
      credentials: "include" as const,
      headers: cookie
        ? {
            cookie,
          }
        : undefined,
    },
    //to reset cache
    exchanges: [
      dedupExchange,
      cacheExchange({
        // ERROR IN OUR PAGINATION bc of PaginatedPosts `Query.posts({"cursor":"","limit":10})` has a selection set, but no key could be generated for the data at this field.
        // You have to request `id` or `_id` fields for all selection sets or create a custom `keys` config for `PaginatedPosts`.
        // we can fix it by this
        keys: {
          PaginatedPosts: () => null, //BC this is an object
        },
        //this is for pagination ########################
        //will change the cache after cursorPagination() and will return a new data to posts
        resolvers: {
          Query: {
            posts: cursorPagination(),
          },
        },
        /////////////// abaove pagination ################
        updates: {
          Mutation: {
            deletePost: (_result, args, cache, info) => {
              //we jsut need to invalidate the post to delete it
              //cache.invalidate can be use to deleteor evict an entity from the cache

              cache.invalidate({
                __typename: "Post",
                id: (args as DeletePostMutationVariables).id,
              });
            },
            createPost: (_result, args, cache, info) => {
              invalidateAllPost(cache);
            },
            vote: (_result, args, cache, info) => {
              //args has an arguments like in our vote graphql
              const { postId, value } = args as VoteMutationVariables;
              //we assign post and the id and points
              //and how are we going to look for it is by it's id
              const data = cache.readFragment(
                gql`
                  fragment _ on Post {
                    id
                    points
                    voteStatus
                  }
                `,
                { id: postId }
              );

              if (data) {
                if (data.voteStatus === args.value) {
                  //If the voteStatus is 1 and the value is 1 also we will not write
                  return;
                }
                //if we got a data from the cache
                //we will write something there
                //we need to also find the're id
                const newPoints =
                  //if null then one only and if not then should be 2 * value
                  data.points + (!data.voteStatus ? 1 : 2) * value;
                console.log(newPoints);
                cache.writeFragment(
                  gql`
                    fragment __ on Post {
                      id
                      points
                      voteStatus
                    }
                  `,
                  { id: postId, points: newPoints, voteStatus: value }
                );
              }
            },
            logout: (_result, args, cache, info) => {
              // logout let's make the me into null
              betterUpdateQuery<LogoutMutation, MeQuery>(
                cache, //cache
                { query: MeDocument }, //need to be change
                _result, //the logout data
                () => ({
                  me: null,
                })
              );
            },
            login: (_result, args, cache, info) => {
              // ...
              //(LoginMutation, MeQuery>) 2 arguments in function callback
              betterUpdateQuery<LoginMutation, MeQuery>(
                cache, //cache
                { query: MeDocument }, //Queryinput to change the datas
                _result, //the log in data
                //reusult of log in data, //the query
                //query is the one that we can return too same as the data of result
                // the result and query is from fn
                (result: LoginMutation, query: MeQuery) => {
                  if (result.login.errors) {
                    return query;
                  } else {
                    return {
                      me: result.login.user,
                    };
                  }
                }
              );
              invalidateAllPost(cache);
            },
            register: (_result, args, cache, info) => {
              // ...
              betterUpdateQuery<RegisterMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.register.errors) {
                    return query;
                  } else {
                    return {
                      me: result.register.user,
                    };
                  }
                }
              );
            },
          },
        },
      }),
      errorExchange,
      ssrExchange,
      fetchExchange,
    ],
  };
};
