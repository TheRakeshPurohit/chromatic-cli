import task from '../components/task';
import { failed, initial, pending, skipped, success } from './build';

export default {
  title: 'CLI/Tasks/Build',
  decorators: [(storyFunction) => task(storyFunction())],
};

const buildCommand = 'yarn run build-storybook -o storybook-static';

export const Initial = () => initial;

export const Building = () => pending({ buildCommand } as any);

export const Built = () =>
  success({
    now: 0,
    startedAt: -32_100,
    buildLogFile: '/users/me/project/build-storybook.log',
  } as any);

export const Skipped = () =>
  skipped({
    options: { storybookBuildDir: '/users/me/project/storybook-static' },
  } as any);

export const Failed = () => failed({ buildCommand } as any);
