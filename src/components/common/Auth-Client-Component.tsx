"use client";
import React from 'react';
import { LoginForm } from './Login-Form';
import { SignupForm } from './Signup-Form';

export const AuthClientComponent= ({isAdmin, isClient}:{isAdmin:boolean;isClient:boolean;})=> {
  const [signupClicked, setSignupClicked] = React.useState(false);

  const onSignupClick = () => {
    setSignupClicked((prev) => !prev);
  };

  return (
    <>
      {signupClicked ? (
        <SignupForm onSignupClick={onSignupClick} />
      ) : (
        <LoginForm onSignupClick={onSignupClick} isAdmin={isAdmin} isClient={isClient} />
      )}
    </>
  );
}
