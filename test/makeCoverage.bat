@echo off
SET FUNCTION_FLOW_COV=1
if not exist coverage mkdir coverage
cmd /c jscoverage --no-highlight ../lib coverage/lib
mocha -R html-cov %1 >coverage.html