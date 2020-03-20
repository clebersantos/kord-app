import React from "react";
import { Link } from "gatsby";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpotify, faYoutube } from "@fortawesome/free-brands-svg-icons";

import Kord3D from "../assets/kord-3d.svg";

import styles from "./styles/login.module.css";

const LoginPanel = ({ login }) => {
  const text = login ? "Log in" : "Sign up";

  return (
    <div className={styles.loginWrapper}>
      <div className={styles.loginHeaderWrapper}>
        <Link to="/">
          <h1>
            <Kord3D />
          </h1>
        </Link>
      </div>
      <hr />
      <h3>{`To continue, ${text.toLowerCase()} to Kord`}</h3>
      <div className={styles.loginListWrapper}>
        <a href="/auth/spotify" className={styles.oAuthLink}>
          <span style={{ color: "#1DB954" }}>
            <FontAwesomeIcon icon={faSpotify} size="3x" />
          </span>
          <span>{`${text} with Spotify`}</span>
        </a>
        <a href="/auth/youtube" className={styles.oAuthLink}>
          <span style={{ color: "red" }}>
            <FontAwesomeIcon icon={faYoutube} size="3x" />
          </span>
          <span>{`${text} with Youtube`}</span>
        </a>
      </div>
      {login ? (
        <span className={styles.otherPanelWrapper}>
          {"New here? "}

          <Link to="/signup">
            <strong>Sign Up</strong>
          </Link>
        </span>
      ) : (
        <span className={styles.otherPanelWrapper}>
          {"Already a member? "}
          <Link to="/login">Log In</Link>
        </span>
      )}
    </div>
  );
};

LoginPanel.propTypes = {
  login: PropTypes.bool.isRequired
};

export default LoginPanel;