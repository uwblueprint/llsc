import React, { useContext, useState } from "react";
import register from "../APIClients/AuthAPIClient";
//import { HOME_PAGE } from "../../constants/Routes";
//import AuthContext from "../../contexts/AuthContext";
//import { AuthenticatedUser } from "../../types/AuthTypes";

const Signup = (): React.ReactElement => {
  //const { authenticatedUser, setAuthenticatedUser } = useContext(AuthContext);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(0);

  const onSignupClick = async () => {
    const user = await register(firstName, lastName, email, password, role);
    console.log(user);
    //setAuthenticatedUser(user);
  };

  //if (authenticatedUser) {
    //return <Redirect to={HOME_PAGE} />;
  //}

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
            onChange={(event) => setPassword(event.target.value)}
            placeholder=""
          />
        </div>
        <div>
          <input
            type="Confirm Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder=""
          />
        </div>
        {/* add select for participant/volunteer */}
        <div>
          <button
            className="btn btn-primary"
            type="button"
            onClick={onSignupClick}
          >
            Continue 
          </button>
        </div>
        {/* add already have account, add confirm password is same */}
      </form>
    </div>
  );
};

export default Signup;