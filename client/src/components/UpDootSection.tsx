import { Flex, Box, Icon, Button } from "@chakra-ui/react";
import React from "react";
import { useState } from "react";
import { PostSnippetFragment, useVoteMutation } from "../generated/graphql";

export interface UpDootSectionProps {
  post: PostSnippetFragment; //or    PostsQuery["posts"]["posts"][0];
}

const UpDootSection: React.FC<UpDootSectionProps> = ({ post }) => {
  const [updootLoading, setUpdootLoading] = useState<
    "updoot-loading" | "downdoot-loading" | "not-loading"
  >("not-loading");
  const [, vote] = useVoteMutation();
  return (
    <Flex direction="column" justifyItems="center" alignItems="center" mr={4}>
      <Box>
        {" "}
        <Button
          onClick={async () => {
            if (post.voteStatus === 1) {
              return;
            }
            setUpdootLoading("updoot-loading");
            await vote({ value: 1, postId: post.id });
            setUpdootLoading("not-loading");
          }}
          color={post.voteStatus === 1 ? "green" : undefined}
          isLoading={updootLoading === "updoot-loading"}
          name="ChevronUpIcon"
          size="24px"
        >
          Up
        </Button>
      </Box>
      <Box> {post.points}</Box>
      <Box>
        <Button
          onClick={async () => {
            if (post.voteStatus === -1) {
              return;
            }
            setUpdootLoading("downdoot-loading");
            await vote({ value: -1, postId: post.id });
            setUpdootLoading("not-loading");
          }}
          color={post.voteStatus === -1 ? "red" : undefined}
          isLoading={updootLoading === "downdoot-loading"}
          name="ChevronDownIcon"
          size="24px"
        >
          Down
        </Button>
      </Box>
    </Flex>
  );
};

export default UpDootSection;
