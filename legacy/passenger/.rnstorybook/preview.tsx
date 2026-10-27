import type { Preview } from '@storybook/react-native';

import { StoryFrame } from '@trustcab/ui/storybook';

const preview: Preview = {
  decorators: [
    (Story, { parameters }) => (
      <StoryFrame padded={parameters.layout !== 'fullscreen'}>
        <Story />
      </StoryFrame>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
