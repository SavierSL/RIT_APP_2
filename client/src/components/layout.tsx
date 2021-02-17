import React from "react";
import Wrapper from "./wrapper";
import NavBar from "./navBar";

const Layout: React.FC<{}> = ({ children }) => {
  return (
    <>
      <NavBar />
      <Wrapper>{children}</Wrapper>
    </>
  );
};

export default Layout;
