import { Button } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { withUrqlClient } from "next-urql";
import router from "next/dist/next-server/lib/router/router";
import { useRouter } from "next/router";
import React from "react";
import InputField from "../../../components/inputField";
import Layout from "../../../components/layout";
import {
  usePostQuery,
  useUpdatePostMutation,
} from "../../../generated/graphql";
import { createUrqlClient } from "../../../util/createUrqlClient";

export interface EditPostProps {}

const EditPost: React.FC<EditPostProps> = () => {
  const router = useRouter();
  //TO MAKE THE ID QUERY A NUMBER
  const intId =
    typeof router.query.id === "string" ? parseInt(router.query.id) : -1;
  const [{ data, error, fetching }] = usePostQuery({
    //if we have an ugly id req then we will just pause it
    pause: intId === -1,
    variables: {
      id: intId,
    },
  });
  const [, updatePost] = useUpdatePostMutation();

  if (fetching) {
    return <div>LOADING..</div>;
  }
  if (!data?.post) {
    return <div>Cannot find post</div>;
  }
  return (
    <>
      <Layout>
        <Formik
          initialValues={{ title: data.post.title, text: data.post.text }}
          onSubmit={async (values) => {
            console.log(values);
            await updatePost({
              id: intId,
              ...values,
            });
            router.push("/");
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
                Edit Post
              </Button>
            </Form>
          )}
        </Formik>
      </Layout>
    </>
  );
};

export default withUrqlClient(createUrqlClient)(EditPost);
