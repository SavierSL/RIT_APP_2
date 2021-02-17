import {
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Button,
} from "@chakra-ui/react";
import { Formik, Form } from "formik";
import React from "react";

import InputField from "../components/inputField";
import Wrapper from "../components/wrapper";
import { useLoginMutation } from "../generated/graphql";
import { toErrorMap } from "../util/toErrorMap";
import { useRouter } from "next/router";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../util/createUrqlClient";
export interface LogInProps {}

const LogIn: React.FC<LogInProps> = () => {
  const router = useRouter(); //NextJS property
  //console.log(router)
  //we can see a query object with next: /create-post
  const [, login] = useLoginMutation(); // [information = ('fetching, data, and etc') , our function]
  console.log(router);
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ usernameOrEmail: "", password: "" }}
        onSubmit={async (values, { setErrors }) => {
          const res = await login(values);
          //to make this optional (res.data.register.user.id;) checking turn on the use strict on ts
          if (res.data?.login.errors) {
            //this can be undefined
            //if there is error
            //[{field: 'username',message:'somethingwrong'}]
            setErrors(toErrorMap(res.data.login.errors));
          } else if (res.data?.login.user) {
            //worked
            if (typeof router.query.next === "string") {
              router.push(router.query.next);
            } else {
              router.push("/");
            }
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="usernameOrEmail"
              placeholder="username or email"
              label="username or email"
            />
            <InputField
              name="password"
              placeholder="password"
              label="Password"
              type="password"
            />
            <Button type="submit" isLoading={isSubmitting}>
              Log In
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(LogIn);
