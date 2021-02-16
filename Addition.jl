################################################################################
#   Functionality: Intakes 2 values, one from each port and outputs the sum.
#   Author: Aneta Pawelec
#   Date: 12.11.2020

function Addition_main(inPort1, inPort2, outPort1, variables)
    number1 = take!(inPort1)
    number2 = take!(inPort2)

    sum = parse(Int64 ,number1) + parse(Int64 ,number2)

    put!(outPort1, sum)
end
