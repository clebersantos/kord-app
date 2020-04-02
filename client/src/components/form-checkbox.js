import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

import styles from "../styles/modal.module.css";

const FormCheckbox = ({ title, i, value, onChange }) => (
  <label
    className={`${styles.checkboxLabel} ${value ? styles.changesMade : null}`}
    htmlFor={`checkbox${i}`}
  >
    <span>{title}</span>
    <input
      id={`checkbox${i}`}
      type="checkbox"
      checked={value}
      onChange={onChange}
    />
    <FontAwesomeIcon icon={faCheck} size="lg" />
  </label>
);

FormCheckbox.propTypes = {
  title: PropTypes.string.isRequired,
  i: PropTypes.number.isRequired,
  value: PropTypes.bool,
  onChange: PropTypes.func.isRequired
};

FormCheckbox.defaultProps = {
  value: false
};

export default FormCheckbox;