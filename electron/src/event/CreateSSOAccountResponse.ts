interface CreateSSOAccountDetail {
  reachedMaximumAccounts: boolean;
}

class CreateSSOAccountResponse extends CustomEvent<CreateSSOAccountDetail> {
  constructor(eventName: string, detail: CustomEventInit<CreateSSOAccountDetail>) {
    super(eventName, detail);
  }
}

export {CreateSSOAccountResponse};
