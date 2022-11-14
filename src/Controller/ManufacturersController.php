<?php

namespace App\Controller;

use App\Entity\Distributors;
use App\Entity\Manufacturers;
use App\Entity\ManufacturerUsers;
use Nzo\UrlEncryptorBundle\Encryptor\Encryptor;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class ManufacturersController extends AbstractController
{
    private $encryptor;

    public function __construct(Encryptor $encryptor)
    {
        $this->encryptor = $encryptor;
    }

    #[Route('/manufacturer/register', name: 'manufacturer_reg')]
    public function manufacturerReg(Request $request): Response
    {

        return $this->render('frontend/manufacturers/register.html.twig');
    }

    #[Route('/manufacturers/register/create', name: 'manufacturer_create')]
    public function manufacturerCreateAction(Request $request, UserPasswordHasherInterface $passwordHasher, MailerInterface $mailer): Response
    {
        $data = $request->request;
        $hashedEmail = md5($data->get('email'));
        $manufacturer = $this->em->getRepository(Manufacturers::class)->findOneBy([
            'hashedEmail' => $hashedEmail,
        ]);

        if($manufacturer == null)
        {
            $manufacturer = new Manufacturers();

            $plainTextPwd = $this->generatePassword();

            if (!empty($plainTextPwd)) {

                $domainName = explode('@', $data->get('email'));

                $manufacturer->setName($this->encryptor->encrypt($data->get('manufaturer-name')));
                $manufacturer->setEmail($this->encryptor->encrypt($data->get('email')));
                $manufacturer->setHashedEmail(md5($data->get('email')));
                $manufacturer->setDomainName(md5($domainName[1]));
                $manufacturer->setTelephone($this->encryptor->encrypt($data->get('telephone')));
                $manufacturer->setIntlCode($this->encryptor->encrypt($data->get('intl-code')));
                $manufacturer->setIsoCode($this->encryptor->encrypt($data->get('iso-code')));

//                if(!empty($_FILES['distributor_form']['name']['logo'])) {
//
//                    $extension = pathinfo($_FILES['distributor_form']['name']['logo'], PATHINFO_EXTENSION);
//                    $file = $distributor->getId() . '-' . uniqid() . '.' . $extension;
//                    $targetFile = __DIR__ . '/../../public/images/logos/' . $file;
//
//                    if (move_uploaded_file($_FILES['distributor_form']['tmp_name']['logo'], $targetFile)) {
//
//                        $distributor->setLogo($file);
//                        $logo = $file;
//                    }
//                }

                $this->em->persist($manufacturer);
                $this->em->flush();

                // Create user
                $manufacturerUsers = new DistributorUsers();

                $hashed_pwd = $passwordHasher->hashPassword($manufacturerUsers, $plainTextPwd);

                $manufacturerUsers->setDistributor($manufacturer);
                $manufacturerUsers->setFirstName($this->encryptor->encrypt($data->get('first-name')));
                $manufacturerUsers->setLastName($this->encryptor->encrypt($data->get('last-name')));
                $manufacturerUsers->setEmail($this->encryptor->encrypt($data->get('email')));
                $manufacturerUsers->setHashedEmail(md5($data->get('email')));
                $manufacturerUsers->setTelephone($this->encryptor->encrypt($data->get('telephone')));
                $manufacturerUsers->setRoles(['ROLE_MANUFACTURER']);
                $manufacturerUsers->setPassword($hashed_pwd);
                $manufacturerUsers->setIsPrimary(1);

                $this->em->persist($manufacturerUsers);
                $this->em->flush();


                // Send Email
                $body = '<table style="padding: 8px; border-collapse: collapse; border: none; font-family: arial">';
                $body .= '<tr><td colspan="2">Hi '. $data->get('first_name') .',</td></tr>';
                $body .= '<tr><td colspan="2">&nbsp;</td></tr>';
                $body .= '<tr><td colspan="2">Please use the credentials below login to the Fluid Backend.</td></tr>';
                $body .= '<tr><td colspan="2">&nbsp;</td></tr>';
                $body .= '<tr>';
                $body .= '    <td><b>URL: </b></td>';
                $body .= '    <td><a href="https://'. $_SERVER['HTTP_HOST'] .'/manufacturers/login">https://'. $_SERVER['HTTP_HOST'] .'/distributor/login</a></td>';
                $body .= '</tr>';
                $body .= '<tr>';
                $body .= '    <td><b>Username: </b></td>';
                $body .= '    <td>'. $data->get('email') .'</td>';
                $body .= '</tr>';
                $body .= '<tr>';
                $body .= '    <td><b>Password: </b></td>';
                $body .= '    <td>'. $plainTextPwd .'</td>';
                $body .= '</tr>';
                $body .= '</table>';

                $html = $this->forward('App\Controller\ResetPasswordController::emailFooter', [
                    'html'  => $body,
                ]);

                $email = (new Email())
                    ->from($this->getParameter('app.email_from'))
                    ->addTo($data->get('email'))
                    ->subject('Fluid Login Credentials')
                    ->html($html);

                $mailer->send($email);
            }

            $response = 'Your Fluid account was successfully created, an email with your login credentials has been sent to your inbox.';

        } else {

            $response = false;
        }

        return new JsonResponse($response);
    }

    #[Route('/distributors/register/check-email', name: 'distributor_check_email')]
    public function distributorsCheckEmailAction(Request $request): Response
    {
        $email = $request->request->get('email');
        $domainName = explode('@', $email);
        $response['response'] = true;
        $restrictedDomains = $this->em->getRepository(RestrictedDomains::class)->arrayFindAll();

        foreach($restrictedDomains as $restrictedDomain)
        {
            if(md5($domainName[1]) == md5($restrictedDomain->getName()))
            {
                $response['response'] = false;
                $response['restricted'] = true;

                return new JsonResponse($response);
            }
        }

        $manufacturer = $this->em->getRepository(Manufacturers::class)->findOneBy([
            'hashedEmail' => md5($email),
        ]);

        $manufacturerDomain = $this->em->getRepository(Manufacturers::class)->findOneBy([
            'domainName' => md5($domainName[1]),
        ]);

        $manufacturerUsers = $this->em->getRepository(ManufacturerUsers::class)->findOneBy([
            'hashedEmail' => md5($email),
        ]);

        if($manufacturer != null || $manufacturerUsers != null || $clinic != null || $clinicUsers != null || $clinicDomain != null || $manufacturerDomain != null)
        {
            $response['response'] = false;
            $response['restricted'] = false;
        }

        return new JsonResponse($response);
    }

    #[Route('/manufacturers/error', name: 'manufacturer_error_500')]
    public function manufacturer500ErrorAction(Request $request): Response
    {
        $id = $this->getUser()->getManufacturer()->getId();

        if($id == null)
        {
            return $this->render('security/login.html.twig', [
                'last_username' => '',
                'error' => '',
                'csrf_token_intention' => 'authenticate',
                'user_type' => 'manufacturers',

            ]);
        }

        return $this->render('bundles/TwigBundle/Exception/error500.html.twig',[
            'type' => 'manufacturers',
            'id' => $id,

        ]);
    }

    private function generatePassword()
    {
        $sets = [];
        $sets[] = 'abcdefghjkmnpqrstuvwxyz';
        $sets[] = 'ABCDEFGHJKMNPQRSTUVWXYZ';
        $sets[] = '23456789';
        $sets[] = '!@$%*?';

        $all = '';
        $password = '';

        foreach ($sets as $set)
        {
            $password .= $set[array_rand(str_split($set))];
            $all .= $set;
        }

        $all = str_split($all);

        for ($i = 0; $i < 16 - count($sets); $i++)
        {
            $password .= $all[array_rand($all)];
        }

        $this->plainPassword = str_shuffle($password);

        return $this->plainPassword;
    }
}
