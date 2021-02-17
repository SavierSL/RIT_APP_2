import { NextPage } from "next";

export interface ChangePasswordProps {}

const ChangePassword: NextPage<{ token: string }> = ({ token }) => {
  return <>token is{token}</>;
};
//getting param props
ChangePassword.getInitialProps = ({ query }) => {
  return {
    token: query.token as string,
  };
};
export default ChangePassword;
