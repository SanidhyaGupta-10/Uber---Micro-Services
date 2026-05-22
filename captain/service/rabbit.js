import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBIT_URL;

/**
 * Establishes a connection to RabbitMQ and creates a shared channel.
 * Should be called once at application startup.
 */

async function connect() {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    console.log('Connected to RabbitMQ');
}

/**
 * Subscribes to a named RabbitMQ queue and invokes a callback for each incoming message.
 * Auto-connects if no channel is available.
 *
 * @async
 * @param {string}   queueName - Name of the queue to subscribe to
 * @param {Function} callback  - Function called with the message content as a string
 * @returns {Promise<void>}
 */

async function subscribeToQueue(queueName, callback) {
    if (!channel) await connect();
    await channel.assertQueue(queueName);
    channel.consume(queueName, (message) => {
        callback(message.content.toString());
        channel.ack(message);
    });
}

/**
 * Publishes a message to a named RabbitMQ queue.
 * Auto-connects if no channel is available.
 *
 * @async
 * @param {string} queueName - Name of the queue to publish to
 * @param {string} data      - Serialized message data (typically a JSON string)
 * @returns {Promise<void>}
 */

async function publishToQueue(queueName, data) {
    if (!channel) await connect();
    await channel.assertQueue(queueName);
    channel.sendToQueue(queueName, Buffer.from(data));
}

export default { subscribeToQueue, publishToQueue, connect };