import { useRouter } from "next/router";
import { useEffect } from "react";
import { useMeQuery } from "../generated/graphql";

export const useIsAuth = () => {
  //GETTING THE DATA FROM ME query
  const [{ data, fetching }] = useMeQuery();
  //lets use this
  const router = useRouter();
  //CREATE POST

  useEffect(() => {
    //there is no data and not loading
    if (!data?.me && !fetching) {
      // if it failed this next query will be added and the router.pathname, it is depend on the url 'dynamic'
      // we are telling if where ti should go after it logged in
      // this will become /login?next=/create-post. if logged in will go to create-post
      router.push("/login?next=" + router.pathname);
    }
  }, [data, fetching, router]);
};
