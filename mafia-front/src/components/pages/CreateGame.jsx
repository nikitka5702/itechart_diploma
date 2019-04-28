import React, { Component, Fragment } from 'react'
import { Formik, Form, ErrorMessage } from 'formik'
import gql from 'graphql-tag'
import { ApolloConsumer, Mutation } from 'react-apollo'
import * as Yup from 'yup'

import M from 'materialize-css/dist/js/materialize'

import MaterializeField from '../MaterializeField'

const CREATE_GAME = gql`
mutation CreateGame($name: String!, $extended: Boolean!, $cardSet: Int!, $players: Int!, $asMafia: Int!, $asDoctor: Int, $asSheriff: Int) {
  createGame(name: $name, extended: $extended, cardSet: $cardSet, players: $players, asMafia: $asMafia, asDoctor: $asDoctor, asSheriff: $asSheriff) {
    game {
      id
    	name
    	creator {
      	id
      	username
    	}
    }
  }
}`

const GET_CARD_SETS = gql`
query {
  cardSets {
    id
    name
    extended
  }
}`

const GameSchema = Yup.object().shape({
  name: Yup.string()
    .min(4, 'Too short')
    .max(255, 'Too long')
    .required('Required'),
  extended: Yup.boolean(),
  cardSet: Yup.string().notOneOf(['', '0'], 'Select Card Set').required('Required'),
  players: Yup.number()
    .min(5, 'Minimum number of people is 5')
    .max(10, 'Maximum number of people is 10')
    .required('Required'),
  asMafia: Yup.number()
    .min(1, 'Minimum number as mafia is 1')
    .max(4, 'Maximum number as mafia is 4')
    .required('Required'),
  asDoctor: Yup.number()
    .min(1, 'Minimum is 1')
    .max(2, 'Maximum is 2'),
  asSheriff: Yup.number()
    .min(1, 'Minimum is 1')
    .max(2, 'Maximum is 2')
})

export default class CreateGame extends Component {
  state = {
    cardSets: [],
    fetch: true,
    extended: false
  }

  setCardSets = (cardSets) => this.setState({cardSets, fetch: false})

  changeExtended = () => this.setState({extended: !this.state.extended})

  componentDidUpdate() {
    var elems = document.querySelectorAll('select')
    M.FormSelect.init(elems, {})
  }

  render() {
    return (
      <div className="content">
        <div className="col s8 offset-s2">
          <Mutation
            mutation={CREATE_GAME}
            update={(cache, { data }) => {
              if (data.createGame.game.id) {
                this.props.history.push('games')
              }
            }}
          >
            {(createGame, { data }) => (
              <ApolloConsumer>
                {client => {
                  if (this.state.fetch) {
                    client.query({
                      query: GET_CARD_SETS
                    }).then(d => {
                      console.log(d.data.cardSets)
                      this.setCardSets(d.data.cardSets)
                    })
                  }

                  return (
                    <Formik
                      initialValues={{name: '', extended: this.state.extended, cardSet: '0', players: 5, asMafia: 1, asDoctor: 1, asSheriff: 1}}
                      validationSchema={GameSchema}
                      onSubmit={(values, actions) => {
                        values.cardSet = parseInt(values.cardSet)
                        createGame({variables: values})
                      }}
                      render={({ errors, status, touched, isSubmitting, handleSubmit, handleChange, handleBlur, values }) => (
                        <Form>
                          <div className="row">
                            <div className="col s8 offset-s2">
                              <div className="row">
                                <MaterializeField type="text" name="name" component="p" title="Name" />
                              </div>
                              <div className="row">
                                <div className="col s6">
                                  <div className="input-field">
                                    <label>
                                      <input
                                        name="extended"
                                        type="checkbox"
                                        value={values.extended}
                                        checked={values.extended}
                                        onChange={(e) => {this.changeExtended(); handleChange(e)}}
                                        onBlur={handleBlur}
                                      />
                                      <span>Extended</span>
                                    </label>
                                  </div>
                                </div>
                                <div className="col s6">
                                  <div className="input-field">
                                    <select
                                      name="cardSet"
                                      value={values.cardSet}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                    >
                                      {[<option key={0} value="0" disabled>Select Card Set</option>, ...this.state.cardSets.filter(cardSet => cardSet.extended === values.extended).map(cardSet => (
                                        <option key={cardSet.id} value={cardSet.id}>{cardSet.name}</option>
                                      ))]}
                                    </select>
                                    <label>Card Set</label>
                                    <ErrorMessage name="cardSet" component="p" />
                                  </div>
                                </div>
                              </div>
                              <div className="row">
                                <div className="col s6">
                                  <MaterializeField type="number" name="players" component="p" title="Players" />
                                </div>
                                <div className="col s6">
                                  <MaterializeField type="number" name="asMafia" component="p" title="As Mafia" />
                                </div>
                              </div>
                              {values.extended ? (
                                <div className="row">
                                  <div className="col s6">
                                    <MaterializeField type="number" name="asDoctor" component="p" title="As Doctor" />
                                  </div>
                                  <div className="col s6">
                                    <MaterializeField type="number" name="asSheriff" component="p" title="As Sheriff" />
                                  </div>
                                </div>
                              ) : (
                                <Fragment />
                              )}
                              <button type="submit" className="btn" disabled={isSubmitting}>Create</button>
                            </div>
                          </div>
                        </Form>
                      )}
                    />
                  )
                }}
              </ApolloConsumer>
            )}
          </Mutation>
        </div>
      </div>
    )
  }
}
