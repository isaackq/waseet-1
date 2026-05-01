import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Next, ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { raw } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const apiVersion = process.env.API_VERSION ?? 'v1';

  // Stripe webhook requires raw body for signature verification.
  app.use(
    `/api/${apiVersion}/wallet/payments/webhook`,
    express.raw({ type: 'application/json' }),
  );

  app.setGlobalPrefix(`api/${apiVersion}`);

  const config = new DocumentBuilder()
    .setTitle('Waseet app API') // عنوان الواجهة
    .setDescription('Use the base API URL as http://localhost:3000')
    .setTermsOfService('http://localhost:3000/terms-of-service')
    .setLicense(
      //الاسم والرابط
      'MIT License',
      'https://github.com/git/git-scm.com/blob/main/MIT-LICENSE.txt',
    )
    .addServer('http://localhost:3000', 'Local development server') //يعني الطلبات بتنبعت على هادا السيرفر
    .addServer('https://immense-ridge-71125-2989a571143a.herokuapp.com') // Production
    .setVersion('1.0')
    .addTag('Waseet App') //تصنيف عام لل API
    .addBearerAuth()
    .build();
  //Instantiate Document
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  await app.use('/payment/stripe-confirm', raw({ type: 'application/json' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // whitelist: true يعني اي قيمة جديدة مش موجودة في الدي تي او مش رح تصل الكونترولر
      forbidNonWhitelisted: true, //forbidNonWhitelisted: true :thrwos error when sent addtional feld in the request that does not is the dto// لو مش موجودة القيمة ممكن تصل عن طريق req.body
      transform: true, //transfer the incoming request to an instance of The DTO Class
      transformOptions: {
        //بصير يحول القيمة تلقائي حسب الموجود داخل  ال دي تي او يعني ببطل لازم نعمل تايب ترانسفورمر
        enableImplicitConversion: false, //false because it transform 'false' value into true
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);

  console.log('app started on 3000');
}
void bootstrap();
