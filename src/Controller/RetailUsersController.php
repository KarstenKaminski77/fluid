<?php

namespace App\Controller;

use App\Entity\Clinics;
use App\Entity\ClinicUsers;
use App\Entity\Distributors;
use App\Entity\DistributorUsers;
use App\Entity\Manufacturers;
use App\Entity\ManufacturerUsers;
use App\Entity\RetailUsers;
use App\Form\ResetPasswordRequestFormType;
use Doctrine\ORM\EntityManagerInterface;
use Nzo\UrlEncryptorBundle\Encryptor\Encryptor;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;

class RetailUsersController extends AbstractController
{
    private $plainPassword;
    private $em;
    private $mailer;
    private $encryptor;

    public function __construct(EntityManagerInterface $em, MailerInterface $mailer, Encryptor $encryptor)
    {
        $this->em = $em;
        $this->mailer = $mailer;
        $this->encryptor = $encryptor;
    }
    
    #[Route('/retail/register', name: 'retail_reg')]
    public function retailRegister(): Response
    {
        return $this->render('frontend/retail/register.html.twig', [
            'controller_name' => 'RetailUsersController',
        ]);
    }

    #[Route('/retail/register/create', name: 'retail_create')]
    public function retailCreateAction(Request $request, UserPasswordHasherInterface $passwordHasher): Response
    {
        $data = $request->request;
        $hashedEmail = md5($data->get('email'));
        $retailUser = $this->em->getRepository(RetailUsers::class)->findOneBy([
            'hashedEmail' => $hashedEmail,
        ]);

        if($retailUser == null)
        {
            $retailUser = new RetailUsers();

            $plainTextPwd = $this->generatePassword();

            // Create user
            if (!empty($plainTextPwd))
            {
                $hashedPwd = $passwordHasher->hashPassword($retailUser, $plainTextPwd);

                $retailUser->setFirstName($this->encryptor->encrypt($data->get('first-name')));
                $retailUser->setLastName($this->encryptor->encrypt($data->get('last-name')));
                $retailUser->setEmail($this->encryptor->encrypt($data->get('email')));
                $retailUser->setHashedEmail(md5($data->get('email')));
                $retailUser->setPassword($hashedPwd);
                $retailUser->setRoles(['ROLE_RETAIL']);
                $retailUser->setTelephone($this->encryptor->encrypt($data->get('telephone')));
                $retailUser->setIntlCode($this->encryptor->encrypt($data->get('intl-code')));
                $retailUser->setIsoCode($this->encryptor->encrypt($data->get('iso-code')));

                $this->em->persist($retailUser);
                $this->em->flush();


                // Send Email
                $body = '<table style="padding: 8px; border-collapse: collapse; border: none; font-family: arial">';
                $body .= '<tr><td colspan="2">Hi '. $data->get('first-name') .',</td></tr>';
                $body .= '<tr><td colspan="2">&nbsp;</td></tr>';
                $body .= '<tr><td colspan="2">Please use the credentials below login to Fluid.</td></tr>';
                $body .= '<tr><td colspan="2">&nbsp;</td></tr>';
                $body .= '<tr>';
                $body .= '    <td><b>URL: </b></td>';
                $body .= '    <td><a href="https://'. $_SERVER['HTTP_HOST'] .'/retail/login">https://'. $_SERVER['HTTP_HOST'] .'/retail/login</a></td>';
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
                ])->getContent();

                $email = (new Email())
                    ->from($this->getParameter('app.email_from'))
                    ->addTo($data->get('email'))
                    ->subject('Fluid Login Credentials')
                    ->html($html);

                $this->mailer->send($email);
            }

            $response = 'Your Fluid account was successfully created, an email with your login credentials has been sent to your inbox.';

        } else {

            $response = false;
        }

        return new JsonResponse($response);
    }

    #[Route('/retail/search', name: 'retail_search')]
    public function retailSearchAction(Request $request): Response
    {
        $retailUserId = $this->getUser()->getId();
        $retailUser = $this->em->getRepository(RetailUsers::class)->find($retailUserId);

        return $this->render('frontend/retail/index.html.twig',[
            'retailUser' => $retailUser,
        ]);
    }

    #[Route('/retail/register/check-email', name: 'retail_check_email')]
    public function retailCheckEmailAction(Request $request): Response
    {
        $email = $request->request->get('email');
        $domainName = explode('@', $email);
        $response['duplicate'] = false;
        $response['inValid'] = false;
        $firstName = '';

        // Validate Email Address
        if(count($domainName) !== 2)
        {
            $response['inValid'] = true;

            return new JsonResponse($response);

            die();
        }

        // Duplicate Email Address & Domains
        $manufacturer = $this->em->getRepository(Manufacturers::class)->findOneBy([
            'hashedEmail' => md5($email),
        ]);

        $manufacturerDomain = $this->em->getRepository(Manufacturers::class)->findOneBy([
            'domainName' => md5($domainName[1]),
        ]);

        $manufacturerUsers = $this->em->getRepository(Manufacturers::class)->findOneBy([
            'hashedEmail' => md5($email),
        ]);

        $distributor = $this->em->getRepository(Distributors::class)->findOneBy([
            'hashedEmail' => md5($email),
        ]);

        $distributorDomain = $this->em->getRepository(Distributors::class)->findOneBy([
            'domainName' => md5($domainName[1]),
        ]);

        $distributorUsers = $this->em->getRepository(DistributorUsers::class)->findOneBy([
            'hashedEmail' => md5($email),
        ]);

        $clinic = $this->em->getRepository(Clinics::class)->findOneBy([
            'hashedEmail' => md5($email),
        ]);

        $clinicDomain = $this->em->getRepository(Clinics::class)->findOneBy([
            'domainName' => md5($domainName[1]),
        ]);

        $clinicUsers = $this->em->getRepository(ClinicUsers::class)->findOneBy([
            'hashedEmail' => md5($email),
        ]);

        $retailUsers = $this->em->getRepository(RetailUsers::class)->findOneBy([
            'hashedEmail' => md5($email),
        ]);

        if($clinicDomain != null)
        {
            $user = $this->em->getRepository(ClinicUsers::class)->findOneBy([
                'clinic' => $clinicDomain->getId(),
                'isPrimary' => 1
            ]);
            $firstName = $this->encryptor->decrypt($user->getFirstName());
        }

        if($distributorDomain != null)
        {
            $user = $this->em->getRepository(DistributorUsers::class)->findOneBy([
                'distributor' => $distributorDomain->getId(),
                'isPrimary' => 1
            ]);
            $firstName = $this->encryptor->decrypt($user->getFirstName());
        }

        if($manufacturerDomain != null)
        {
            $user = $this->em->getRepository(ManufacturerUsers::class)->findOneBy([
                'manufacturer' => $manufacturerDomain->getId(),
                'isPrimary' => 1
            ]);
            $firstName = $this->encryptor->decrypt($user->getFirstName());
        }

        if($retailUsers != null)
        {
            $user = $this->em->getRepository(RetailUsers::class)->findOneBy([
                'hashedEmail' => md5($email),
            ]);
            $firstName = $this->encryptor->decrypt($user->getFirstName());
        }

        $response['firstName'] = $firstName;

        if(
            $manufacturer != null || $manufacturerDomain != null || $manufacturerUsers != null ||
            $clinic != null || $clinicUsers != null || $clinicDomain != null || $retailUsers != null ||
            $distributor != null || $distributorUsers != null || $distributorDomain != null
        )
        {
            $response['duplicate'] = true;
        }

        return new JsonResponse($response);
    }

    #[Route('/retail/forgot-password', name: 'retail_forgot_password_request')]
    public function retailForgotPasswordAction(Request $request, MailerInterface $mailer): Response
    {
        $form = $this->createForm(ResetPasswordRequestFormType::class);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {

            $retailUser = $this->em->getRepository(RetailUsers::class)->findOneBy(
                [
                    'hashedEmail' => md5($request->request->get('reset_password_request_form')['email'])
                ]
            );

            if($retailUser != null){

                $resetToken = uniqid();

                $retailUser->setResetKey($resetToken);

                $this->em->persist($retailUser);
                $this->em->flush();

                $html = '
                <p>To reset your password, please visit the following link</p>
                <p>
                    <a
                        href="https://'. $_SERVER['HTTP_HOST'] .'/retail/reset/'. $resetToken .'"
                    >https://'. $_SERVER['HTTP_HOST'] .'/retail/reset/'. $resetToken .'</a>
                </p>';

                $html = $this->forward('App\Controller\ResetPasswordController::emailFooter', [
                    'html'  => $html,
                ]);

                $email = (new Email())
                    ->from($this->getParameter('app.email_from'))
                    ->addTo($this->encryptor->decrypt($retailUser->getEmail()))
                    ->subject('Fluid Password Reset')
                    ->html($html->getContent());

                $this->mailer->send($email);

                return $this->render('reset_password/retail_check_email.html.twig');
            }
        }

        return $this->render('reset_password/request.html.twig', [
            'requestForm' => $form->createView(),
        ]);
    }

    #[Route('/retail/reset/{token}', name: 'retail_reset_password')]
    public function reset(Request $request, UserPasswordHasherInterface $passwordHasher, string $token = null, MailerInterface $mailer): Response
    {
        $plainTextPwd = $this->generatePassword();
        $retailUser = $this->em->getRepository(RetailUsers::class)->findOneBy([
            'resetKey' => $request->get('token')
        ]);

        if (!empty($plainTextPwd)) {

            $hashedPwd = $passwordHasher->hashPassword($retailUser, $plainTextPwd);

            $retailUser->setPassword($hashedPwd);

            $this->em->persist($retailUser);
            $this->em->flush();

            // Send Email
            $body  = '<p style="margin-bottom: 0">Hi '. $this->encryptor->decrypt($retailUser->getFirstName()) .',</p>';
            $body .= '<br>';
            $body .= '<p style="margin-bottom: 0">Please use the credentials below login to the Fluid Backend.</p>';
            $body .= '<br>';
            $body .= '<table style="border: none; font-family: Arial, Helvetica, sans-serif">';
            $body .= '<tr>';
            $body .= '    <td><b>URL: </b></td>';
            $body .= '    <td><a href="https://'. $_SERVER['HTTP_HOST'] .'/retail/login">https://'. $_SERVER['HTTP_HOST'] .'/retail/login</a></td>';
            $body .= '</tr>';
            $body .= '<tr>';
            $body .= '    <td><b>Username: </b></td>';
            $body .= '    <td>'. $this->encryptor->decrypt($retailUser->getEmail()) .'</td>';
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
                ->addTo($this->encryptor->decrypt($retailUser->getEmail()))
                ->subject('Fluid Login Credentials')
                ->html($html->getContent());

            $mailer->send($email);
        }

        return $this->redirectToRoute('retail_password_reset');
    }

    #[Route('/retail/password/reset', name: 'retail_password_reset')]
    public function retialPasswordReset(Request $request): Response
    {
        return $this->render('reset_password/retail_password_reset.html.twig');
    }

    #[Route('/retail/error', name: 'retail_error_500')]
    public function retail500ErrorAction(Request $request): Response
    {
        $username = $this->getUser();
        $id = '';

        if($username != null) {

            $id = $this->getUser()->getId();
        }

        return $this->render('bundles/TwigBundle/Exception/error500.html.twig', [
            'type' => 'retail',
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

        foreach ($sets as $set) {

            $password .= $set[array_rand(str_split($set))];
            $all .= $set;
        }

        $all = str_split($all);

        for ($i = 0; $i < 16 - count($sets); $i++) {

            $password .= $all[array_rand($all)];
        }

        $this->plainPassword = str_shuffle($password);

        return $this->plainPassword;
    }

    private function sendLoginCredentials($retailUser, $plainTextPwd, $data)
    {

        // Send Email
        $body = '<table style="padding: 8px; border-collapse: collapse; border: none; font-family: arial">';
        $body .= '<tr><td colspan="2">Hi '. $data['firstName'] .',</td></tr>';
        $body .= '<tr><td colspan="2">&nbsp;</td></tr>';
        $body .= '<tr><td colspan="2">Please use the credentials below login to the Fluid Backend.</td></tr>';
        $body .= '<tr><td colspan="2">&nbsp;</td></tr>';
        $body .= '<tr>';
        $body .= '    <td><b>URL: </b></td>';
        $body .= '    <td><a href="https://'. $_SERVER['HTTP_HOST'] .'/retail/login">https://'. $_SERVER['HTTP_HOST'] .'/retail/login</a></td>';
        $body .= '</tr>';
        $body .= '<tr>';
        $body .= '    <td><b>Username: </b></td>';
        $body .= '    <td>'. $data['email'] .'</td>';
        $body .= '</tr>';
        $body .= '<tr>';
        $body .= '    <td><b>Password: </b></td>';
        $body .= '    <td>'. $plainTextPwd .'</td>';
        $body .= '</tr>';
        $body .= '</table>';

        $email = (new Email())
            ->from($this->getParameter('app.email_from'))
            ->addTo($data['email'])
            ->subject('Fluid Login Credentials')
            ->html($body);

        $this->mailer->send($email);
    }

    public function getPagination($pageId, $results)
    {
        $currentPage = (int) $pageId;
        $lastPage = $this->page_manager->lastPage($results);

        $pagination = '
        <!-- Pagination -->
        <div class="row mt-3">
            <div class="col-12">';

        if($lastPage > 1) {

            $previousPageNo = $currentPage - 1;
            $url = '/distributors/users';
            $previousPage = $url . $previousPageNo;

            $pagination .= '
            <nav class="custom-pagination">
                <ul class="pagination justify-content-center">
            ';

            $disabled = 'disabled';
            $dataDisabled = 'true';

            // Previous Link
            if($currentPage > 1){

                $disabled = '';
                $dataDisabled = 'false';
            }

            $pagination .= '
            <li class="page-item '. $disabled .'">
                <a 
                    class="user-pagination" 
                    aria-disabled="'. $dataDisabled .'" 
                    data-page-id="'. $currentPage - 1 .'" 
                    href="'. $previousPage .'"
                >
                    <span aria-hidden="true">&laquo;</span> <span class="d-none d-sm-inline">Previous</span>
                </a>
            </li>';

            for($i = 1; $i <= $lastPage; $i++) {

                $active = '';

                if($i == (int) $currentPage){

                    $active = 'active';
                }

                $pagination .= '
                <li class="page-item '. $active .'">
                    <a 
                        class="user-pagination" 
                        data-page-id="'. $i .'" 
                        href="'. $url .'"
                    >'. $i .'</a>
                </li>';
            }

            $disabled = 'disabled';
            $dataDisabled = 'true';

            if($currentPage < $lastPage) {

                $disabled = '';
                $dataDisabled = 'false';
            }

            $pagination .= '
            <li class="page-item '. $disabled .'">
                <a 
                    class="user-pagination" 
                    aria-disabled="'. $dataDisabled .'" 
                    data-page-id="'. $currentPage + 1 .'" 
                    href="'. $url .'"
                >
                    <span class="d-none d-sm-inline">Next</span> <span aria-hidden="true">&raquo;</span>
                </a>
            </li>';

            $pagination .= '
                    </ul>
                </nav>';

            $pagination .= '
                </div>
            </div>';
        }

        return $pagination;
    }
}
