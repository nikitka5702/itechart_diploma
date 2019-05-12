import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import { Field, ErrorMessage } from 'formik'

const MaterializeField = props => {
  const prefix = props.prefix ? (
    <i className="material-icons prefix">{props.prefix}</i>
  ) : (
    <Fragment></Fragment>
  )
  return (
    <div className="input-field">
      {prefix}
      <Field type={props.type} name={props.name} />
      <label htmlFor={props.name}>{props.title}</label>
      <ErrorMessage name={props.name} component={props.component} />
    </div>
  )
}

MaterializeField.propTypes = {
  type: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  component: PropTypes.string.isRequired,
  prefix: PropTypes.string
}

export default MaterializeField
