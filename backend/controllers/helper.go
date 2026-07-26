package controllers

import "strconv"

func toInt(v string) int {

	result, _ :=
		strconv.Atoi(v)

	return result

}

func toFloat(v string) float64 {

	result, _ :=
		strconv.ParseFloat(
			v,
			64,
		)

	return result

}
