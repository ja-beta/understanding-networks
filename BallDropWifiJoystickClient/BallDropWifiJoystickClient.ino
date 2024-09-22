/*
  Joystick client
 Language:  Arduino
 
 This program enables an Arduino to control one paddle 
 in a networked Pong game via a TCP socket. Re-written to work with 
 either WiFi101 library (MKR1000) 
 or WiFiNINA library (Nano 33 IoT, MKR1010)
 
note: WiFi SSID and password are stored in arduino_secrets.h file.
Make updates to that file with your network credentials.
 
 created 20 Jun 2012
 modified 8 Aug 2024
 by Tom Igoe
 */

#include <SPI.h>
// #include <WiFi101.h>      // use this for MKR1000 board
#include <WiFiNINA.h>  // use this for Nano 33 IoT or MKR1010 boards
// #include <WiFiS3.h>      // use this for Uno v4 WiFi board
// #include <WiFi.h>      //Wifi library for ESP32 Nano
#include "arduino_secrets.h"
#include <Arduino_APDS9960.h>
#include "Adafruit_APDS9960.h"
Adafruit_APDS9960 apds;


// Initialize the Wifi client library
WiFiClient client;

const char server[] = "10.23.11.108";
const char yourName[] = "Jasmine";
const int connectButton = 2;  // the pushbutton for connecting/disconnecting
const int connectionLED = 3;  // this LED indicates whether you're connected
const int leftLED = 4;        // this LED indicates that you're moving left
const int rightLED = 5;       // this LED indicates that you're moving right
const int upLED = 6;          // this LED indicates that you're moving uo
const int downLED = 7;        // this LED indicates that you're moving down

const int sendInterval = 20;     // minimum time between messages to the server
const int debounceInterval = 5;  // used to smooth out pushbutton readings

int lastButtonState = HIGH;  // previous state of the pushbutton
long lastTimeSent = 0;       // timestamp of the last server message

int lastConnectState = false;

void setup() {
  //Initialize serial
  Serial.begin(9600);

  // if serial monitor's not open, wait 3 seconds:
  if (!Serial) delay(3000);


  if(!apds.begin()){
    Serial.println("failed to initialize device! Please check your wiring.");
  }
  else Serial.println("Device initialized!");
  apds.enableGesture(true);
  Serial.println("Detecting gestures ...");

  // attempt to connect to Wifi network:
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print("Attempting to connect to SSID: ");
    Serial.println(SECRET_SSID);
    // Connect to WPA/WPA2 network.
    WiFi.begin(SECRET_SSID, SECRET_PASS);

    // wait 3 seconds for connection:
    delay(3000);
  }

  // you're connected now, so print out the status:
  printWifiStatus();
  // initialize digital inputs and outputs:
  pinMode(connectButton, INPUT_PULLUP);
  pinMode(connectionLED, OUTPUT);
  pinMode(leftLED, OUTPUT);
  pinMode(rightLED, OUTPUT);
  pinMode(upLED, OUTPUT);
  pinMode(downLED, OUTPUT);
}

void loop() {
  // check to see if the pushbutton's pressed:
  int buttonState = digitalRead(connectButton);

  // if the button changes state:
  if (buttonState != lastButtonState) {
    Serial.println("button pressed");
    // delay for the debounce interval:
    delay(debounceInterval);
    if (buttonState == LOW) {
      // if the client's not connected, connect:
      if (!client.connected()) {
        Serial.println("connecting");
        client.connect(server, 8080);
      } else {  // else disconnect:
        Serial.println("disconnecting");
        client.print("x");
        client.stop();
      }
    }
    // save current button state for comparison next time:
    lastButtonState = buttonState;
  }

  // if the client's connected, and the send interval has elapased:
  if (client.connected() && (millis() - lastTimeSent > sendInterval) && apds.gestureValid()) {
    uint8_t gesture = apds.readGesture();

    switch (gesture) {
      case APDS9960_UP:
      client.print("w");
      Serial.println("w-up");
      activateLED(upLED);
      break;

      case APDS9960_DOWN:
      client.print("s");
      Serial.println("s-down");
      activateLED(downLED);
      break;

      case APDS9960_RIGHT:
      client.print("d");
      Serial.println("d-right");
      activateLED(rightLED);
      break;

      case APDS9960_LEFT:
      client.print("a");
      Serial.println("a-left");
      activateLED(leftLED);
      break;

      default:
      break;
    }

    //save this moment as last time you sent a message:
    lastTimeSent = millis();
  }

  // set the connection LED based on the connection state:
  digitalWrite(connectionLED, client.connected());

  // if there's incoming data from the client, print it serially:
  if (client.available()) {
    char c = client.read();
    Serial.write(c);
  }

// if connection state has changed:
  if (lastConnectState != client.connected()) {
    if (lastConnectState == false) {
      // send your name, and change to name display ("i");
      client.print("=");
      client.println(yourName);
    }
    lastConnectState = client.connected();
  }
}

void activateLED(int pin){
  digitalWrite(pin, HIGH);
  delay(250);
  digitalWrite(pin, LOW);
}

void printWifiStatus() {
  // print the SSID of the network you're attached to:
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());

  // print your WiFi shield's IP address:
  IPAddress ip = WiFi.localIP();
  Serial.print("IP Address: ");
  Serial.println(ip);

  // print the received signal strength:
  long rssi = WiFi.RSSI();
  Serial.print("signal strength (RSSI):");
  Serial.print(rssi);
  Serial.println(" dBm");
}