/*
 * Copyright (C) 2018-2022 Garden Technologies, Inc. <info@garden.io>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import chalk from "chalk"
import indentString from "indent-string"
import { sortBy } from "lodash"

import { ConfigGraph } from "../graph/config-graph"
import { WorkflowConfig } from "../config/workflow"
import { GardenModule } from "../types/module"
import { GardenTask } from "../types/task"
import { GardenTest } from "../types/test"
import { uniqByName } from "../util/util"

export function getMatchingServiceNames(namesFromOpt: string[] | undefined, configGraph: ConfigGraph) {
  const names = namesFromOpt || []
  if (names.includes("*") || (!!namesFromOpt && namesFromOpt.length === 0)) {
    return configGraph.getServices().map((s) => s.name)
  } else {
    return names
  }
}

export function getDevModeModules(devModeDeployNames: string[], graph: ConfigGraph): GardenModule[] {
  return uniqByName(graph.getServices({ names: devModeDeployNames }).map((s) => s.module))
}

export function getModulesByServiceNames(serviceNames: string[], graph: ConfigGraph): GardenModule[] {
  return uniqByName(graph.getServices({ names: serviceNames }).map((s) => s.module))
}

export function makeGetTestOrTaskResult(modules: GardenModule[], testsOrTasks: GardenTest[] | GardenTask[]) {
  return modules.map((m) => {
    const testsOrTasksForModule = sortBy(
      testsOrTasks.filter((t) => t.module.name === m.name),
      (t) => t.name
    )

    return {
      [m.name]: testsOrTasksForModule.map((t) => ({
        ...t.config.spec,
        name: t.name,
      })),
    }
  })
}

export function makeGetTestOrTaskLog(
  modules: GardenModule[],
  testsOrTasks: GardenTest[] | GardenTask[],
  type: "tests" | "tasks"
) {
  let logStr = ""
  for (const m of modules) {
    const enitities = sortBy(
      testsOrTasks.filter((t) => t.module.name === m.name),
      (t) => t.name
    )

    const logStrForTasks = enitities.map((t) => indentString(prettyPrintTestOrTask(t), 2)).join("\n")

    logStr += `${type} in module ${chalk.green(m.name)}` + "\n" + logStrForTasks + "\n"
  }
  return logStr
}

export function prettyPrintWorkflow(workflow: WorkflowConfig): string {
  let out = `${chalk.cyan.bold(workflow.name)}`

  if (workflow.description) {
    out += "\n" + indentString(printField("description", workflow.description), 2)
  } else {
    out += "\n"
  }

  return out
}

function prettyPrintTestOrTask(testOrTask: GardenTask | GardenTest): string {
  let out = `${chalk.cyan.bold(testOrTask.name)}`

  if (testOrTask.spec.args || testOrTask.spec.args === null) {
    out += "\n" + indentString(printField("args", testOrTask.spec.args), 2)
  } else {
    out += "\n" + indentString(printField("command", testOrTask.spec.command), 2)
  }

  if (testOrTask.spec.description) {
    out += "\n" + indentString(printField("description", testOrTask.spec.description), 2)
  }

  if (testOrTask.config.dependencies.length) {
    out += "\n" + indentString(`${chalk.gray("dependencies")}:`, 2) + "\n"
    out += indentString(testOrTask.config.dependencies.map((depName) => `• ${depName}`).join("\n"), 4)
    out += "\n"
  } else {
    out += "\n"
  }

  return out
}

function printField(name: string, value: string | null) {
  return `${chalk.gray(name)}: ${value || ""}`
}
