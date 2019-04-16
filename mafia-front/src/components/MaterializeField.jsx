import React from 'react'
import PropTypes from 'prop-types'
import { Field, ErrorMessage } from 'formik'

const MaterializeField = props => {
  return (
    <div className="input-field">
      <label htmlFor={props.name}>{props.title}</label>
      <Field type={props.type} name={props.name} />
      <ErrorMessage name={props.name} component={props.component} />
    </div>
  )
}

MaterializeField.propTypes = {
  type: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  component: PropTypes.string.isRequired
}

export default MaterializeField
