import React, { useContext, useState } from "react";
import { Redirect } from "react-router-dom";
import authAPIClient from "../../APIClients/AuthAPIClient";
import { HOME_PAGE } from "../../constants/Routes";
import AuthContext from "../../contexts/AuthContext";
import { AuthenticatedUser } from "../../types/AuthTypes";

const Signup = (): React.ReactElement => {
  const { authenticatedUser, setAuthenticatedUser } = useContext(AuthContext);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // graphql {
  const [register] = useMutation<{ register: AuthenticatedUser }>(REGISTER);
  // } graphql

  const onSignupClick = async () => {
    const user: AuthenticatedUser = await authAPIClient.register(
      firstName,
      lastName,
      email,
      password,
      register,
    );
    setAuthenticatedUser(user);
  };

  if (authenticatedUser) {
    return <Redirect to={HOME_PAGE} />;
  }

  return (
    <div style={{ textAlign: "center" }}>
      <h1>First Connection Peer Support Program</h1>
      <h2>Welcome to our application portal!</h2>
      <h3>Let's start by creating an account.</h3>
      <form>
        <div>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="john.doe@gmail.com"
          />
        </div>
        <div>
          <input
            type="password"
            value={password}
            onChange={(event) => setLastName(event.target.value)}
            placeholder=""
          />
        </div>
        <div>
          <button
            className="btn btn-primary"
            type="button"
            onClick={onSignupClick}
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
};

export default Signup;