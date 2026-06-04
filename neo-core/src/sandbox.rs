use rustpython::{InterpreterBuilder, InterpreterBuilderExt};
use rustpython::vm::compiler::Mode;
use rustpython::vm::AsObject;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn neo_run_sandbox(script: &str, input_json: &str) -> String {
    let interp = InterpreterBuilder::new()
        .init_stdlib()
        .interpreter();

    interp.enter(|vm| {
        let scope = vm.new_scope_with_builtins();
        
        let neo_input = vm.ctx.new_str(input_json);
        if let Err(_) = scope.globals.set_item("NEO_INPUT", neo_input.into(), vm) {
            return "Error: Could not inject NEO_INPUT".to_string();
        }

        let mut indented_script = String::new();
        for line in script.lines() {
            indented_script.push_str("    ");
            indented_script.push_str(line);
            indented_script.push('\n');
        }

        let source = format!(
"import sys, json
class StringOut:
    def __init__(self):
        self.out = ''
    def write(self, s):
        self.out += str(s)
    def flush(self):
        pass
    def getvalue(self):
        return self.out
sys.stdout = StringOut()
sys.stderr = StringOut()
try:
{}
except Exception as e:
    sys.stderr.write(type(e).__name__ + ': ' + str(e) + '\\n')
",
            indented_script
        );

        let code_obj = match vm.compile(&source, Mode::Exec, "<neo-sandbox>".to_owned()) {
            Ok(c) => c,
            Err(e) => return format!("Syntax Error: {:?}", e),
        };

        if let Err(e) = vm.run_code_obj(code_obj, scope.clone()) {
            let mut err_msg = "Unknown error".to_string();
            if let Ok(repr) = e.as_object().repr(vm) {
                err_msg = repr.to_string();
            }
            return format!("Fatal Runtime Error: {}", err_msg);
        }

        let eval_source = "sys.stdout.getvalue() + sys.stderr.getvalue()";
        let eval_code = vm.compile(eval_source, Mode::Eval, "<eval>".to_owned()).unwrap();
        
        match vm.run_code_obj(eval_code, scope) {
            Ok(val) => {
                if let Ok(s) = val.str(vm) {
                    let out = s.to_string().trim().to_string();
                    if out.is_empty() {
                        "Success (No output)".to_string()
                    } else {
                        out
                    }
                } else {
                    "Success (Invalid output type)".to_string()
                }
            },
            Err(_) => "Error retrieving stdout".to_string()
        }
    })
}
