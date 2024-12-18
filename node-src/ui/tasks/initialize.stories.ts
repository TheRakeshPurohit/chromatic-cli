import task from '../components/task';
import { initial, pending, success } from './initialize';

export default {
  title: 'CLI/Tasks/Initialize',
  decorators: [(storyFunction: any) => task(storyFunction())],
};

const announcedBuild = {
  number: 42,
};

export const Initial = () => initial;

export const Pending = () => pending();

export const Success = () => success({ announcedBuild } as any);
