import { Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import { useEffect } from "react";
import InputField from "../components/inputField";
import Layout from "../components/layout";
import { useCreatepostMutation, useMeQuery } from "../generated/graphql";
import { createUrqlClient } from "../util/createUrqlClient";
import { useIsAuth } from "../util/useIsAuth";

export interface CreatePostProps {}

const CreatePost: React.FC<{}> = () => {
  const router = useRouter();
  useIsAuth();
  //CREATE POST
  const [, createpost] = useCreatepostMutation();

  return (
    <Layout>
      <Formik
        initialValues={{ title: "", text: "" }}
        onSubmit={async (values) => {
          //WE CAN DO THIS BUT THERE IS A BETTER WAY
          //CHECK createUrqlClient.tsx
          //   const { error } = await createPost(values);
          //   if (error?.message.includes("Not Logged In")) {
          //     router.push("/login");
          //   } else {
          //     router.push("/");
          //   }
          // ###############################################################
          const { error } = await createpost(values);
          console.log(error);
          if (!error) {
            //if there is no error
            router.push("/");
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField name="title" placeholder="Title" label="Title" />
            <InputField
              textarea
              name="text"
              placeholder="text..."
              label="Text"
            />
            <Button type="submit" isLoading={isSubmitting}>
              create post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};
export default withUrqlClient(createUrqlClient, { ssr: true })(CreatePost); //DONT FORGET THISS!!!
