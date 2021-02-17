import { UsernamePasswordInput } from "../resolvers/user";

export const validateRegister = (options: UsernamePasswordInput) => {
  if (!options.email.includes("@")) {
    return {
      errors: [
        {
          field: "email",
          message: "Invalid email",
        },
      ],
    };
  }
  if (options.username.includes("@")) {
    return {
      errors: [
        {
          field: "username",
          message: "Cannot include @",
        },
      ],
    };
  }
  if (options.username.length <= 2) {
    return {
      errors: [
        {
          field: "username",
          message: "must be greater than 2",
        },
      ],
    };
  }
  if (options.password.length <= 6) {
    return {
      errors: [
        {
          field: "password",
          message: "must be greater than 6",
        },
      ],
    };
  }
  return null;
};
