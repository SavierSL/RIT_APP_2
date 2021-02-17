import { Box, Button, Flex, Link } from "@chakra-ui/react";
import React from "react";
import NextLink from "next/link";
import { useMeQuery, useLogoutMutation } from "../generated/graphql";
import { isServer } from "../util/isServer";
import Wrapper from "./wrapper";
import { useRouter } from "next/router";
export interface NavBarProps {}

const NavBar: React.FC<NavBarProps> = () => {
  const router = useRouter();
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
  const [{ data, fetching }] = useMeQuery({ pause: isServer() }); //it is running automatically
  let body = null;

  //data is loading
  if (fetching) {
    //user not logged in
  } else if (!data?.me) {
    //use is logged in
    body = (
      <>
        <NextLink href="login">
          <Link color="white" mr={4}>
            Login
          </Link>
        </NextLink>
        <NextLink href="register">
          <Link color="white" mr={4}>
            Register
          </Link>
        </NextLink>
      </>
    );
    //if logged in
  } else {
    body = (
      <Flex>
        <Box ml={"auto"} mr={5}>
          {data?.me?.username}
        </Box>{" "}
        <Button
          onClick={async () => {
            await logout();
            router.reload();
          }}
          isLoading={logoutFetching}
          variant="link"
        >
          Log Out
        </Button>
      </Flex>
    );
  }
  return (
    <Flex zIndex={1} position="sticky" top={0} bg="tan" p={4} align="center">
      <Flex m="auto" maxW={800} bg="tomato" p={4}>
        <NextLink href="create-post">
          <Link mr={5}>Create Post</Link>
        </NextLink>
        <NextLink href="/">
          <Link color="white" mr={5}>
            Home
          </Link>
        </NextLink>
        <Box>{body}</Box>
      </Flex>
    </Flex>
  );
};

export default NavBar;
