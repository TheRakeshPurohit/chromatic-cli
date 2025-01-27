import chalk from 'chalk';
import { dedent } from 'ts-dedent';

import { Context } from '../../../types';
import { warning } from '../../components/icons';

const getHint = (buildScriptName: string | undefined, buildScript: string) => {
  if (!buildScript) return '';

  if (buildScript.includes('npm run '))
    return dedent(chalk`
      It appears you're using {bold "npm run"} which is known to cause this problem.
      You can fix this by invoking {bold build-storybook} from your {bold "${buildScriptName}"} script directly.
    `);

  const invokesBuild = /(^| )build-storybook( |;|&&)/.test(buildScript);
  const isChained = /build-storybook.*(&&|;)/.test(buildScript);
  if (invokesBuild && isChained)
    return dedent(chalk`
      This happens if {bold build-storybook} is not the last command in the script (e.g. you're using {bold &&} or {bold ;} to chain commands).
      You should use an npm {bold post*} script instead of command chaining.
    `);

  return '';
};

export default (
  { sourceDir, options, packageJson }: Pick<Context, 'sourceDir' | 'options' | 'packageJson'>,
  outputDirectory: string
) => {
  const { buildScriptName } = options;
  const buildScript =
    packageJson.scripts && buildScriptName && packageJson.scripts[buildScriptName];

  return dedent(chalk`
    ${warning} {bold Unexpected build directory}
    The CLI tried to build your Storybook at {bold ${sourceDir}}
    but instead it was built at {bold ${outputDirectory}}
    Make sure your {bold "${buildScriptName}"} script forwards the {bold --output-dir (-o)} flag to the {bold build-storybook} CLI.

    ${getHint(buildScriptName, buildScript)}
  `).trim();
};
