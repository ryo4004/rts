import { Route, Switch } from 'react-router-dom'
import { applyMiddleware, compose, createStore } from 'redux'
import { Provider } from 'react-redux'
import { createBrowserHistory } from 'history'
import createRootReducer from './Store/Store'
// import logger from 'redux-logger'
import thunk from 'redux-thunk'

import Main from './Component/Main/Main'
import { routerMiddleware, ConnectedRouter } from 'connected-react-router'

import { GA_ID } from './Library/Library'

const history = createBrowserHistory()
const store = createStore(
  createRootReducer(history),
  compose(
    applyMiddleware(
      routerMiddleware(history),
      // logger,
      thunk
    )
  )
)

history.listen((location) => {
  if (!window.gtag) return false
  window.gtag('config', GA_ID, {
    page_path: location.pathname,
  })
})

const App = () => {
  return (
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <Switch>
          <Route path="/" component={Main} />
        </Switch>
      </ConnectedRouter>
    </Provider>
  )
}

export default App
