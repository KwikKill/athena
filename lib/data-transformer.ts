export interface TransformationRule {
  type: "filter" | "map" | "sort" | "aggregate" | "custom"
  field?: string
  operation?: string
  value?: any
  expression?: string
}

export class DataTransformer {
  static transform(data: any[], rules: TransformationRule[]): any[] {
    let result = [...data]

    for (const rule of rules) {
      switch (rule.type) {
        case "filter":
          result = this.applyFilter(result, rule)
          break
        case "map":
          result = this.applyMap(result, rule)
          break
        case "sort":
          result = this.applySort(result, rule)
          break
        case "aggregate":
          result = this.applyAggregate(result, rule)
          break
        case "custom":
          result = this.applyCustom(result, rule)
          break
      }
    }

    return result
  }

  private static applyFilter(data: any[], rule: TransformationRule): any[] {
    if (!rule.field || !rule.operation) return data

    return data.filter((item) => {
      const value = this.getNestedValue(item, rule.field!)

      switch (rule.operation) {
        case "equals":
          return value === rule.value
        case "not_equals":
          return value !== rule.value
        case "greater_than":
          return Number(value) > Number(rule.value)
        case "less_than":
          return Number(value) < Number(rule.value)
        case "contains":
          return String(value).toLowerCase().includes(String(rule.value).toLowerCase())
        case "exists":
          return value !== undefined && value !== null
        default:
          return true
      }
    })
  }

  private static applyMap(data: any[], rule: TransformationRule): any[] {
    if (!rule.field) return data

    return data.map((item) => ({
      ...item,
      [rule.field!]: this.transformValue(this.getNestedValue(item, rule.field!), rule.operation, rule.value),
    }))
  }

  private static applySort(data: any[], rule: TransformationRule): any[] {
    if (!rule.field) return data

    return [...data].sort((a, b) => {
      const aVal = this.getNestedValue(a, rule.field!)
      const bVal = this.getNestedValue(b, rule.field!)

      if (rule.operation === "desc") {
        return bVal > aVal ? 1 : -1
      }
      return aVal > bVal ? 1 : -1
    })
  }

  private static applyAggregate(data: any[], rule: TransformationRule): any[] {
    if (!rule.field || !rule.operation) return data

    const values = data.map((item) => Number(this.getNestedValue(item, rule.field!)))
    let result: number

    switch (rule.operation) {
      case "sum":
        result = values.reduce((sum, val) => sum + (val || 0), 0)
        break
      case "avg":
        result = values.reduce((sum, val) => sum + (val || 0), 0) / values.length
        break
      case "min":
        result = Math.min(...values)
        break
      case "max":
        result = Math.max(...values)
        break
      case "count":
        result = data.length
        break
      default:
        return data
    }

    return [{ [rule.field]: result }]
  }

  private static applyCustom(data: any[], rule: TransformationRule): any[] {
    if (!rule.expression) return data

    try {
      // Simple expression evaluation (in production, use a proper expression parser)
      const func = new Function("data", `return ${rule.expression}`)
      return func(data)
    } catch (error) {
      console.error("Error in custom transformation:", error)
      return data
    }
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj)
  }

  private static transformValue(value: any, operation?: string, operand?: any): any {
    if (!operation) return value

    switch (operation) {
      case "multiply":
        return Number(value) * Number(operand)
      case "divide":
        return Number(value) / Number(operand)
      case "add":
        return Number(value) + Number(operand)
      case "subtract":
        return Number(value) - Number(operand)
      case "uppercase":
        return String(value).toUpperCase()
      case "lowercase":
        return String(value).toLowerCase()
      case "format_date":
        return new Date(value).toLocaleDateString()
      default:
        return value
    }
  }
}

// jQuery-like data transformation capabilities
export class JQueryTransformer {
  private data: any[]

  constructor(data: any[]) {
    this.data = Array.isArray(data) ? data : []
  }

  // jQuery-like methods
  filter(selector: string | ((item: any, index: number) => boolean)): JQueryTransformer {
    if (typeof selector === "function") {
      this.data = this.data.filter(selector)
    } else {
      // Parse selector like ".field:value" or "[field=value]"
      this.data = this.data.filter((item) => this.matchesSelector(item, selector))
    }
    return this
  }

  map(callback: (item: any, index: number) => any): JQueryTransformer {
    this.data = this.data.map(callback)
    return this
  }

  each(callback: (item: any, index: number) => void): JQueryTransformer {
    this.data.forEach(callback)
    return this
  }

  find(selector: string): JQueryTransformer {
    const results: any[] = [];

    for (const item of this.data) {
      const found = this.findInObject(item, selector);
      if (found.length) results.push(...found);
    }

    // Si on a trouvé un unique array, on le déroule.
    if (results.length === 1 && Array.isArray(results[0])) {
      this.data = results[0];
    } else if (results.length > 0 && results.every(Array.isArray)) {
      // Plusieurs arrays → on aplatit d’un niveau.
      this.data = ([] as any[]).concat(...results);
    } else {
      this.data = results;
    }

    return this;
  }

  sort(field?: string, direction: "asc" | "desc" = "asc"): JQueryTransformer {
    this.data.sort((a, b) => {
      const aVal = field ? this.getNestedValue(a, field) : a
      const bVal = field ? this.getNestedValue(b, field) : b

      if (direction === "desc") {
        return bVal > aVal ? 1 : -1
      }
      return aVal > bVal ? 1 : -1
    })
    return this
  }

  slice(start: number, end?: number): JQueryTransformer {
    this.data = this.data.slice(start, end)
    return this
  }

  first(count = 1): JQueryTransformer {
    this.data = this.data.slice(0, count)
    return this
  }

  last(count = 1): JQueryTransformer {
    this.data = this.data.slice(-count)
    return this
  }

  where(conditions: Record<string, any>): JQueryTransformer {
    this.data = this.data.filter((item) => {
      return Object.entries(conditions).every(([key, value]) => {
        const itemValue = this.getNestedValue(item, key)
        return itemValue === value
      })
    })
    return this
  }

  select(fields: string | string[]): JQueryTransformer {
    const fieldArray = Array.isArray(fields) ? fields : [fields]
    this.data = this.data.map((item) => {
      const selected: any = {}
      fieldArray.forEach((field) => {
        const [path, alias] = field.split(/\s+as\s+/i)
        const value = this.getNestedValue(item, path.trim())
        selected[alias?.trim() || path] = value
      })
      return selected
    })
    return this
  }


  groupBy(field: string): Record<string, any[]> {
    const groups: Record<string, any[]> = {}
    this.data.forEach((item) => {
      const key = this.getNestedValue(item, field)
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    })
    return groups
  }

  sum(field?: string): number {
    return this.data.reduce((sum, item) => {
      const value = field ? this.getNestedValue(item, field) : item
      return sum + (Number(value) || 0)
    }, 0)
  }

  avg(field?: string): number {
    const total = this.sum(field)
    return this.data.length > 0 ? total / this.data.length : 0
  }

  count(): number {
    return this.data.length
  }

  min(field?: string): number {
    const values = this.data.map((item) => {
      const value = field ? this.getNestedValue(item, field) : item
      return Number(value) || 0
    })
    return Math.min(...values)
  }

  max(field?: string): number {
    const values = this.data.map((item) => {
      const value = field ? this.getNestedValue(item, field) : item
      return Number(value) || 0
    })
    return Math.max(...values)
  }

  // Get the final result
  get(): any[] {
    return this.data
  }

  // Helper methods
  private matchesSelector(item: any, selector: string): boolean {
    // Simple selector parsing - can be extended
    if (selector.startsWith("[") && selector.endsWith("]")) {
      // Attribute selector [field=value]
      const match = selector.slice(1, -1).match(/(.+?)=(.+)/)
      if (match) {
        const [, field, value] = match
        return this.getNestedValue(item, field) == value.replace(/['"]/g, "")
      }
    }
    return true
  }

  private findInObject(obj: any, selector: string): any[] {
    const out: any[] = [];

    const normalize = (p: string) =>
      p.split('.').filter(seg => !/^\d+$/.test(seg)).join('.'); // supprime les indices d’array

    const visit = (node: any, path = "") => {
      if (node === null || typeof node !== "object") return;

      for (const [key, value] of Object.entries(node)) {
        const currentPath = path ? `${path}.${key}` : key;

        const isKeyMatch = key === selector;                  // match exact sur la clé
        const isPathMatch = normalize(currentPath) === selector; // match exact sur le chemin normalisé

        if (isKeyMatch || isPathMatch) {
          out.push(value);
          continue; // IMPORTANT : ne pas descendre dans une branche déjà matchee
        }

        if (value && typeof value === "object") {
          visit(value, currentPath);
        }
      }
    };

    visit(obj);
    return out;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj)
  }
}

// Factory function for jQuery-like syntax
export function $(data: any[]): JQueryTransformer {
  return new JQueryTransformer(data)
}

// Enhanced DataTransformer with jQuery support
export class EnhancedDataTransformer extends DataTransformer {
  static transformWithJQuery(data: any[], expression: string): any[] {
    try {
      // Create a safe evaluation context
      const context = {
        $: (data: any[]) => new JQueryTransformer(data),
        data,
        Math,
        Date,
        String,
        Number,
        Array,
        Object,
      }

      // Create function with restricted context
      const func = new Function(...Object.keys(context), `return ${expression}`)
      const result = func(...Object.values(context))

      // Return array result
      return Array.isArray(result) ? result : result?.get?.() || [result]
    } catch (error) {
      console.error("Error in jQuery transformation:", error)
      return data
    }
  }
}
