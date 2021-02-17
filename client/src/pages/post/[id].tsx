import { Heading } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import Layout from "../../components/layout";
import { usePostQuery } from "../../generated/graphql";
import { createUrqlClient } from "../../util/createUrqlClient";

export interface PostProps {}

const Post: React.FC<PostProps> = () => {
  const router = useRouter();
  const intId =
    typeof router.query.id === "string" ? parseInt(router.query.id) : -1;
  const [{ data, error, fetching }] = usePostQuery({
    //if we have an ugly id req then we will just pause it
    pause: intId === -1,
    variables: {
      id: intId,
    },
  });

  if (fetching) {
    return (
      <Layout>
        <div>loading...</div>
      </Layout>
    );
  } //I had an error here earlier bc the creator was not added in query post, so I added a relation

  return (
    <>
      <Layout>
        <Heading>{data?.post?.title}</Heading>
        {data?.post?.text}
      </Layout>
    </>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
