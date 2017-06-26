import { connect } from 'react-redux'

import { addAccountWithSession, switchAccount } from '../actions'
import Sidebar from '../components/Sidebar'

const mapStateToProps = (state) => {
  return {
    accounts: state.accounts
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onAddAccountClick: () => {
      dispatch(addAccountWithSession())
    },
    onSwitchAccountClick: (id) => {
      dispatch(switchAccount(id))
    }
  }
}

const TeamsSidebar = connect(
  mapStateToProps,
  mapDispatchToProps
)(Sidebar)

export default TeamsSidebar
