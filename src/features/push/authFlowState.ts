let ssoAuthInProgress = false;

export const beginSsoAuth = () => {
  ssoAuthInProgress = true;
};

export const endSsoAuth = () => {
  ssoAuthInProgress = false;
};

export const isSsoAuthInProgress = () => ssoAuthInProgress;
