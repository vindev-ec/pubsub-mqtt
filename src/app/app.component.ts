import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import * as mqtt from 'mqtt';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  public port = '';
  public host = '';
  public username = '';
  public password = '';
  public statusBroker = 'Apagado...';
  public colorStatusBroker = 'text-secondary';
  public subTopics = '';
  public messages = [];
  public pubTopic = '';
  public pubMessage = '';
  private client;
  private subLastTopics = '';

  constructor(
    private titleService: Title,
    private toastrService: ToastrService
  ) {
    const self = this;
    this.titleService.setTitle('MQTT | Vindev');
  }

  ngOnInit(): void {}

  conectar(): void {
    const self = this;

    if (this.client) {
      this.client.end();
    }

    if (this.host === '' && this.port === '') {
      this.toastrService.error(
        'Asegúrate de llenar los campos obligatorios',
        '¡Alerta!'
      );
      return;
    }

    this.client = mqtt.connect(`mqtt://${this.host}:${this.port}`, {
      clientId: 'web_' + Math.random().toString(16).substr(2, 8),
      username: this.username,
      password: this.password,
    });

    this.client.on('error', (err) => {
      self.statusBroker = 'Error en conexión...';
      self.colorStatusBroker = 'text-danger';
      this.toastrService.error(err.message, '¡Alerta!');
      self.client.end();
    });

    this.client.on('connect', () => {
      self.statusBroker = 'Conectado...';
      self.colorStatusBroker = 'text-success';
      self.toastrService.success('Broker conectado', '¡Éxito!');
    });

    this.client.on('close', () => {
      self.statusBroker = 'Cerrado...';
      self.colorStatusBroker = 'text-secondary';
      self.toastrService.info('Broker cerrado', 'Información');
      self.client.end();
    });

    this.client.on('message', (topic, message) => {
      if (
        topic.toString() !== '' &&
        self.subTopics.split(';').indexOf(topic.toString()) > -1
      ) {
        self.messages.push({
          topic,
          message,
        });
      }
    });
  }

  desconectar(): void {
    if (this.client) {
      this.client.end();
      this.subLastTopics = '';
    }
  }

  limpiar(): void {
    this.messages = [];
  }

  subscribir(): void {
    const self = this;
    if (!this.client || !this.client.connected) {
      this.toastrService.error('No hay conexión al broker', '¡Alerta!');
      return;
    }

    if (this.subTopics === '' && this.subLastTopics === '') {
      this.toastrService.error(
        'Asegúrate de llenar los campos obligatorios',
        '¡Alerta!'
      );
      return;
    }

    // Salir
    this.subLastTopics.split(';').forEach((item, i) => {
      if (self.subTopics.split(';').indexOf(item) === -1) {
        self.client.unsubscribe(item);
      }
    });

    // Entrar
    this.subTopics.split(';').forEach((item, i) => {
      if (self.subLastTopics.split(';').indexOf(item) === -1) {
        self.client.subscribe(item);
      }
    });

    this.subLastTopics = this.subTopics;

    self.toastrService.success('Proceso realizado con éxito', '¡Éxito!');
  }

  publicar(): void {
    const self = this;
    if (!this.client || !this.client.connected) {
      this.toastrService.error('No hay conexión al broker', '¡Alerta!');
      return;
    }

    if (this.pubTopic === '' && this.pubMessage === '') {
      this.toastrService.error(
        'Asegúrate de llenar los campos obligatorios',
        '¡Alerta!'
      );
      return;
    }

    this.client.publish(this.pubTopic, this.pubMessage);

    self.toastrService.success('Proceso realizado con éxito', '¡Éxito!');
  }
}
