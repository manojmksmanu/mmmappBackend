const { Expo } = require("expo-server-sdk");

const expo = new Expo();

// const sendPushNotification = async (expoPushToken, messageBody, data = {}) => {
//   try {
//     const pushTokens = Expo.isExpoPushToken(expoPushToken);
//     console.log(pushTokens);
//     if (pushTokens.length === 0) {
//       console.log(`No valid Expo push tokens for user: ${userId}`);
//       return;
//     }

//     const messages = pushTokens.map((pushToken) => ({
//       to: pushToken,
//       sound: "default",
//       body: messageBody,
//       data: data,
//     }));

//     const chunks = expo.chunkPushNotifications(messages);
//     for (let chunk of chunks) {
//       try {
//         let receipts = await expo.sendPushNotificationsAsync(chunk);
//         console.log("Receipts for push notifications:", receipts);
//       } catch (error) {
//         console.error("Error sending push notifications:", error);
//       }
//     }
//   } catch (error) {
//     console.error("Error fetching user or sending notifications:", error);
//   }
// };
const sendPushNotification = async (
  expoPushToken,
  title,
  messageBody,
  data = {}
) => {
  const expo = new Expo(); // Create an instance of Expo

  try {
    // Ensure that data is always an object
    if (data && typeof data !== "object") {
      throw new Error("The data must be an object");
    }

    // Check if the provided expoPushToken is valid
    if (!Expo.isExpoPushToken(expoPushToken)) {
      console.log(`No valid Expo push token.`);
      return;
    }

    const message = {
      to: expoPushToken,
      sound: "default",
      title: title,
      body: messageBody,
      data: data || {},
      android: {
        icon: "https://cdn-icons-png.flaticon.com/128/5540/5540520.png", // Replace with your icon URL or local asset
        priority: "high", // Optional, to set the priority of the notification
      },
      ios: {
        sound: "default",
        badge: 1, // Optionally, set the badge count (usually used for unread messages)
        icon: "https://cdn-icons-png.flaticon.com/128/5540/5540520.png", // Optionally set a custom icon for iOS (ensure it's included in your app assets)
      },
    };

    try {
      // Send the push notification
      let receipt = await expo.sendPushNotificationsAsync([message]); // Send a single message in an array
      console.log("Receipt for push notification:", receipt);
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  } catch (error) {
    console.error("Error fetching user or sending notification:", error);
  }
};

module.exports = sendPushNotification;
