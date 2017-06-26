import React from 'react'

import TeamIcon from './TeamIcon'

import './Sidebar.css'

const Sidebar = ({ accounts, onAddAccountClick, onSwitchAccountClick }) =>
  <div className="Sidebar">
    {accounts.map(account => (
      <div className={"Sidebar-icon " + (account.badgeCount > 0 ? "Sidebar-icon-badge" : '')} key={account.id}>
        <TeamIcon account={account} onClick={() => onSwitchAccountClick(account.id)} />
      </div>
    ))}
    <div className="Sidebar-account-add" onClick={onAddAccountClick} >
      <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 6.125v1.75h6.125V14h1.75V7.875H14v-1.75H7.875V0h-1.75v6.125" fillRule="evenodd"/>
      </svg>
    </div>
  </div>

export default Sidebar
