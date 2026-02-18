import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'ecobidStorage',
  access: (allow) => ({
    'uploads/*': [
      allow.guest.to(['read', 'write']),
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
  }),
});
