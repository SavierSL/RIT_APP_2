import {
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Button,
} from "@chakra-ui/react";
import { Formik, Form } from "formik";
import React from "react";
import { useMutation } from "urql";
import InputField from "../components/inputField";
import Wrapper from "../components/wrapper";
import { useRegisterMutation } from "../generated/graphql";
import { toErrorMap } from "../util/toErrorMap";
import { useRouter } from "next/router";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../util/createUrqlClient";

export interface RegisterProps {}

const Register: React.FC<RegisterProps> = () => {
  const router = useRouter(); //NextJS property
  const [, register] = useRegisterMutation(); // [information = ('fetching, data, and etc') , our function]
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ email: "", username: "", password: "" }}
        onSubmit={async (values, { setErrors }) => {
          const res = await register(values);
          //to make this optional (res.data.register.user.id;) checking turn on the use strict on ts
          if (res.data?.register.errors) {
            //this can be undefined
            //if there is error
            //[{field: 'username',message:'somethingwrong'}]
            setErrors(toErrorMap(res.data.register.errors));
          } else if (res.data?.register.user) {
            //worked
            router.push("/");
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField name="email" placeholder="email" label="Email" />
            <InputField
              name="username"
              placeholder="username"
              label="Username"
            />

            <InputField
              name="password"
              placeholder="password"
              label="Password"
              type="password"
            />
            <Button type="submit" isLoading={isSubmitting}>
              Register
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(Register);
