import React from 'react'
import ReactDOM from 'react-dom'

import ApolloClient from 'apollo-boost'
import ApolloProvider from 'react-apollo'
import createHttpLink from 'apollo-link-http'
import setContext from 'apollo-link-context'
import InMemoryCache from 'apollo-cache-inmemory'

import App from './App'

import './index.css'

const httpLink = createHttpLink({
    uri: '/graphql',
})

const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('token')
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
        }
    }
})

const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
})


const app = (
    <ApolloProvider client={client}>
        <App />
    </ApolloProvider>
)


ReactDOM.render(app, document.getElementById('root'));
