package main

import (
	"fmt"
	K "github.com/guillaumewuip/console.go"
	scribeHook "github.com/guillaumewuip/console_scribeAmqp.go"
)

func main() {

	console := K.NewConsole(K.ColorsOptions{})

	h, err := scribeHook.AmqpHook(scribeHook.AmqpOptions{
		"server":       "amqp://localhost",
		"exchange":     "test-notif",
		"exchangeType": "fanout",
		"rountingKey":  "console",
	})

	if err != nil {
		fmt.Println(err)
	} else {
		console.AddHook(h)
	}

	//Example

	world := "World"

	console.Tag("First", "Test").Time().File().Log("Hello %s", world)
}
