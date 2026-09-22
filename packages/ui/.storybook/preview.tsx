import type { Preview } from '@storybook/react-native-web-vite'

import { StoryFrame } from '../src/storybook/StoryFrame';
import { colors } from '../src/theme/tokens';

const preview: Preview = {
  decorators: [
    (Story, { parameters }) => (
      <StoryFrame padded={parameters.layout !== 'fullscreen'}>
        <Story />
      </StoryFrame>
    ),
  ],
  parameters: {
    backgrounds: {
      options: { ground: { name: 'Fundo', value: colors.ground } },
    },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
  initialGlobals: {
    backgrounds: { value: 'ground' },
  },
};

export default preview;
