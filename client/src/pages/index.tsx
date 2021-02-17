export interface IndexProps {}
import React from "react";
import NavBar from "../components/navBar";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../util/createUrqlClient";
import {
  useDeletePostMutation,
  useMeQuery,
  usePostsQuery,
} from "../generated/graphql";
import { Box, Heading, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { Button, Flex } from "@chakra-ui/react";
import { useState } from "react";

import UpDootSection from "../components/UpDootSection";
import { isServer } from "../util/isServer";
import Wrapper from "../components/wrapper";

const Index: React.FC<IndexProps> = () => {
  const [variables, setVariables] = useState({
    limit: 15,
    cursor: "",
  });
  //we need to pass variables in usePostsQuery the limit and cursor?
  const [{ data, fetching }] = usePostsQuery({
    variables: { limit: variables.limit, cursor: variables.cursor },
  });
  //to delete a post
  const [, deletePost] = useDeletePostMutation();
  //To hide the delete button if the post is not the same in current user
  //use diff name bc we already used data name in postquery
  const [{ data: meData }] = useMeQuery();

  if (!fetching && !data) {
    return <div>You have no post </div>;
  }

  return (
    <>
      <NavBar />
      <Heading>SimReddiT</Heading>
      {!data && fetching ? (
        //if there is no data and it is loading
        <div></div>
      ) : (
        //Stack to help us in flex and spacing

        <Stack spacing={9}>
          {/* we added data! we declared it that is is defined so TS dont worry 
          //we use this data!.posts.posts.map((p) bc of hasMore
          */}
          <Wrapper variant="regular">
            {data!.posts.posts.map((p) => {
              return !p ? null : (
                <Flex
                  key={p.id}
                  p={5}
                  justifyContent="space-between"
                  alignItems="center"
                  shadow="md"
                  borderWidth="1px"
                >
                  <Flex>
                    <UpDootSection post={p} />
                    <Box>
                      <NextLink href="/post/[id]" as={`/post/${p.id}`}>
                        <Link>
                          <Heading fontSize="xl">{p.title}</Heading>
                        </Link>
                      </NextLink>
                      <Text>Posted by {p.creator.username}</Text>
                      <Text mt={4}>{p.textSnippet}</Text>{" "}
                    </Box>
                  </Flex>
                  <Box>
                    {meData?.me?.id === p.creator.id ? (
                      //* href the content there is path to the file */}
                      <>
                        <NextLink
                          href="/post/edit/[id]"
                          as={`/post/edit/${p.id}`}
                        >
                          <Button as={Link} color="green">
                            Edit
                          </Button>
                        </NextLink>{" "}
                        <Button
                          onClick={() => deletePost({ id: p.id })}
                          color="red"
                        >
                          Delete
                        </Button>
                      </>
                    ) : (
                      ""
                    )}
                  </Box>

                  {/* we had an error here p.text we should make sure that in postmutation we put text to return  */}
                </Flex>
              );
            })}
          </Wrapper>
        </Stack>
      )}
      {data && data.posts.hasMore ? (
        <Flex>
          {/* isLoading={fetching} if we are still getting data it is disabled */}
          <Button
            onClick={() =>
              setVariables({
                ...variables,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
              })
            }
            m="auto"
            my={4}
            isLoading={fetching}
          >
            Load More
          </Button>
        </Flex>
      ) : null}
    </>
  );
};

//we do this to connect to our graphql and also to get the datas from the database
export default withUrqlClient(createUrqlClient, { ssr: true })(Index); //add as const in  credentials: "include" as const,
//ssr is for serverside rendering
